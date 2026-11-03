"use client";

import { Capacitor } from "@capacitor/core";
import { FloatingBubble } from "@/plugins/floating-bubble";

export default function SignOutButton() {
  return (
    <button
      type="submit"
      onClick={() => {
        if (Capacitor.isNativePlatform()) {
          FloatingBubble.hide().catch(() => {});
          FloatingBubble.clearSession().catch(() => {});
        }
      }}
      className="text-sm text-neutral-400 hover:text-white"
    >
      Sair
    </button>
  );
}
