import fs from "node:fs";

const envText = fs.readFileSync(".env", "utf8");
const match = envText.match(/^FIREBASE_ADMIN_SERVICE_ACCOUNT=(.*)$/m);
if (!match) {
  console.error("Variable not found in .env");
  process.exit(1);
}
let value = match[1].trim();
// Strip wrapping double-quotes if present
if (value.startsWith('"') && value.endsWith('"')) {
  value = value.slice(1, -1);
  // Unescape backslash-quote and backslash-n inside the wrapped string
  value = value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}
const parsed = JSON.parse(value);
fs.mkdirSync(".secrets", { recursive: true });
fs.writeFileSync(".secrets/firebase-admin.json", JSON.stringify(parsed, null, 2));
console.log("Wrote .secrets/firebase-admin.json · project:", parsed.project_id, "· email:", parsed.client_email);
