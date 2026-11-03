"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { FloatingBubble } from "@/plugins/floating-bubble";

const RESYNC_INTERVAL_MS = 10 * 60 * 1000; // access_token do Supabase expira em 1h; resincroniza bem antes disso

async function syncNativeSession() {
  try {
    const res = await fetch("/api/session", { cache: "no-store" });
    if (!res.ok) {
      await FloatingBubble.clearSession().catch(() => {});
      return;
    }
    const data = await res.json();
    await FloatingBubble.setSession({
      sessionId: data.sessionId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      supabaseUrl: data.supabaseUrl,
      supabaseAnonKey: data.supabaseAnonKey,
      apiBaseUrl: window.location.origin,
    });
  } catch {
    // rede instável, próxima sincronização tenta de novo — não é crítico
  }
}

// Mantém o plugin nativo da bolha flutuante com um token válido. Roda só
// dentro do app Android empacotado (Capacitor); no navegador comum é um
// no-op silencioso.
export default function NativeBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    syncNativeSession();
    const interval = setInterval(syncNativeSession, RESYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
