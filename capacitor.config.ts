import type { CapacitorConfig } from "@capacitor/cli";

// Este app usa Server Actions, Server Components e proxy (middleware) do
// Next.js — funcionalidades incompatíveis com "next export" (site estático).
// Por isso o Capacitor não empacota HTML/JS local: o WebView carrega
// diretamente a URL do servidor (igual uma Trusted Web Activity). `webDir`
// só existe porque o schema do Capacitor exige a pasta, mas fica vazio.
//
// Trocar `server.url` para a URL de produção (Vercel) antes de gerar o APK
// de release. Durante desenvolvimento, aponta pro IP da máquina na rede
// local (a mesma exibida pelo `npm run dev` em "Network:").
const isProd = process.env.CAP_ENV === "production";

const config: CapacitorConfig = {
  appId: "br.com.lucroreal.app",
  appName: "Lucro Real",
  webDir: "out",
  server: {
    url: isProd ? "https://lucro-real-seven.vercel.app" : "http://192.168.15.6:3000",
    cleartext: !isProd,
  },
};

export default config;
