"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

type LoginReason = "session_replaced" | "access_expired" | null;

export default function LoginForm({ reason }: { reason: LoginReason }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-white">Lucro Real</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Entre com o e-mail e senha que você recebeu por e-mail após a compra.
      </p>

      {reason === "session_replaced" && (
        <p className="mt-4 rounded-lg bg-amber-950 px-3 py-2 text-sm text-amber-300">
          Sua sessão foi encerrada porque essa conta foi acessada em outro dispositivo.
        </p>
      )}

      {reason === "access_expired" && (
        <p className="mt-4 rounded-lg bg-amber-950 px-3 py-2 text-sm text-amber-300">
          Seu acesso expirou. Renove sua assinatura para continuar usando o Lucro Real.
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
