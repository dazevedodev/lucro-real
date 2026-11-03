import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O WebView do Capacitor (server.url) acessa o dev server pelo IP da LAN
  // em vez de localhost — sem isso o Next bloqueia o websocket de HMR vindo
  // dessa origem, e o cliente entra num loop de reload que apaga formulários.
  allowedDevOrigins: ["192.168.15.6"],
};

export default nextConfig;
