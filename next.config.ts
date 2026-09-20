import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  // En Vercel, el rastreador de archivos no siempre detecta todo lo que
  // necesitan playwright-core y @sparticuz/chromium (binario de Chromium
  // incluido); se incluyen explícitamente para la función que genera la
  // boleta.
  outputFileTracingIncludes: {
    "/api/registro": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
};

export default nextConfig;
