"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "E-mail ou senha inválidos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("must_change_password, access_expires_at")
    .eq("id", data.user.id)
    .single();

  // Acesso é por 1 ano a partir da compra (ou renovação), não vitalício.
  if (profile && new Date(profile.access_expires_at) < new Date()) {
    await supabase.auth.signOut();
    return { error: "Seu acesso expirou. Renove sua assinatura para continuar usando o Lucro Real." };
  }

  // Sessão única: gera um novo token, sobrescreve no perfil (derrubando
  // qualquer outra sessão aberta) e grava no cookie desta sessão.
  const sessionId = randomUUID();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ active_session_id: sessionId })
    .eq("id", data.user.id);

  if (updateError) {
    return { error: "Não foi possível iniciar a sessão. Tente novamente." };
  }

  const cookieStore = await cookies();
  cookieStore.set("lr_session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(profile?.must_change_password ? "/trocar-senha" : "/");
}
