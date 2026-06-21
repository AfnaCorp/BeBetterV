"use client";

import { Fragment, type ReactNode } from "react";

/**
 * Rendu Markdown minimal pour les réponses du coach. Couvre le sous-ensemble que
 * l'agent produit réellement : gras `**…**`, italique `*…*`, code `` `…` ``,
 * titres `#`/`##`, listes à puces (`-`, `*`) et numérotées (`1.`), paragraphes.
 *
 * Volontairement sans dépendance ni HTML brut (pas de risque XSS) : on ne rend que
 * des éléments React typés à partir du texte.
 */

/** Découpe une ligne en segments inline (gras / italique / code). */
function renderInline(text: string, keyBase: string): ReactNode[] {
  // Ordre : code d'abord (pour ne pas interpréter * à l'intérieur), puis gras, puis italique.
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return tokens.map((tok, i) => {
    const key = `${keyBase}-${i}`;
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <strong key={key} className="font-semibold">{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith("*") && tok.endsWith("*")) {
      return <em key={key}>{tok.slice(1, -1)}</em>;
    }
    return <Fragment key={key}>{tok}</Fragment>;
  });
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "h"; level: number; text: string };

/** Regroupe les lignes en blocs (paragraphes, listes, titres). */
function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", lines: para });
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);

    if (line.trim() === "") {
      flushPara();
    } else if (heading) {
      flushPara();
      blocks.push({ type: "h", level: heading[1].length, text: heading[2] });
    } else if (bullet) {
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last && last.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
    } else if (ordered) {
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last && last.type === "ol") last.items.push(ordered[1]);
      else blocks.push({ type: "ol", items: [ordered[1]] });
    } else {
      para.push(line);
    }
  }
  flushPara();
  return blocks;
}

export function Markdown({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === "h") {
          return (
            <p key={i} className="font-semibold text-foreground">
              {renderInline(block.text, `h-${i}`)}
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {block.items.map((it, j) => (
                <li key={j}>{renderInline(it, `ul-${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {block.items.map((it, j) => (
                <li key={j}>{renderInline(it, `ol-${i}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        // Paragraphe : les retours à la ligne internes deviennent des <br/>.
        return (
          <p key={i}>
            {block.lines.map((ln, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(ln, `p-${i}-${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
