import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Service worker désactivé en dev (sinon cache gênant + rebuilds lourds).
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Recharge le SW dès qu'une nouvelle version est dispo (pas de page bloquée sur l'ancienne).
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    // Le fallback offline ne s'applique pas aux routes API (réponses LLM dynamiques).
    navigateFallbackDenylist: [/^\/api\//]
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le build de prod (App Hosting) ne doit pas échouer sur du lint / TS :
  // la vérification de types reste faite en local et en CI dédiée.
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default withPWA(nextConfig);
