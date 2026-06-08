/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: false,
  // Le build de prod (App Hosting) ne doit pas échouer sur du lint / TS :
  // la vérification de types reste faite en local et en CI dédiée.
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
