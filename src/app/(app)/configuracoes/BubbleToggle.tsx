"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { FloatingBubble } from "@/plugins/floating-bubble";

type Status = "checking" | "unsupported" | "needs-permission" | "off" | "on";

export default function BubbleToggle() {
  const [status, setStatus] = useState<Status>(() =>
    Capacitor.isNativePlatform() ? "checking" : "unsupported"
  );

  async function refresh() {
    const { granted } = await FloatingBubble.hasOverlayPermission();
    if (!granted) {
      setStatus("needs-permission");
      return;
    }
    const { showing } = await FloatingBubble.isShowing();
    setStatus(showing ? "on" : "off");
  }

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza status inicial com o plugin nativo; padrão de fetch-on-mount, não gera loop
      refresh();
    }
  }, []);

  async function handleEnable() {
    const { granted } = await FloatingBubble.requestOverlayPermission();
    if (!granted) {
      setStatus("needs-permission");
      return;
    }
    // Preenchimento por voz é opcional — se o usuário negar o microfone, a
    // bolha ainda funciona normalmente, só sem o botão de voz habilitado.
    await FloatingBubble.requestMicPermission().catch(() => {});
    await FloatingBubble.show();
    setStatus("on");
  }

  async function handleToggle() {
    if (status === "on") {
      await FloatingBubble.hide();
      setStatus("off");
    } else {
      await FloatingBubble.show();
      setStatus("on");
    }
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-neutral-500">
        A bolha flutuante fica disponível quando você instala o app Android — no navegador ela
        não aparece.
      </p>
    );
  }

  if (status === "checking") {
    return <p className="text-sm text-neutral-500">Verificando permissão…</p>;
  }

  if (status === "needs-permission") {
    return (
      <div>
        <p className="text-sm text-neutral-400">
          Pra registrar corridas sem sair do app da Uber/99, o Lucro Real precisa da permissão
          &quot;Exibir sobre outros apps&quot;.
        </p>
        <button
          onClick={handleEnable}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
        >
          Permitir e ativar bolha
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-neutral-400">
        Bolha flutuante {status === "on" ? "ativada" : "desativada"}.
      </p>
      <button
        onClick={handleToggle}
        className={`rounded-lg px-4 py-2 font-medium text-white ${
          status === "on" ? "bg-neutral-700 hover:bg-neutral-600" : "bg-emerald-600 hover:bg-emerald-500"
        }`}
      >
        {status === "on" ? "Desativar" : "Ativar"}
      </button>
    </div>
  );
}
