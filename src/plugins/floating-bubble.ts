import { registerPlugin } from "@capacitor/core";

export interface FloatingBubbleSession {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
}

export interface FloatingBubblePlugin {
  hasOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<{ granted: boolean }>;
  hasMicPermission(): Promise<{ granted: boolean }>;
  requestMicPermission(): Promise<{ granted: boolean }>;
  setSession(session: FloatingBubbleSession): Promise<void>;
  clearSession(): Promise<void>;
  show(): Promise<void>;
  hide(): Promise<void>;
  isShowing(): Promise<{ showing: boolean }>;
}

// Implementação nativa só existe no Android (android/app/src/main/java/br/com/lucroreal/app/bubble).
// Em web/dev sem o plugin nativo registrado, as chamadas rejeitam a Promise —
// por isso todo uso deve ser condicionado a Capacitor.isNativePlatform().
export const FloatingBubble = registerPlugin<FloatingBubblePlugin>("FloatingBubble");
