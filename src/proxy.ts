import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Páginas públicas: sem sessão, deixa passar; com sessão válida, redireciona
// pra fora (ninguém precisa ver a tela de login já logado).
const PUBLIC_PATHS = ["/login"];

// Rotas de API que fazem a própria autenticação (token/bearer próprio, não
// cookie) — a bolha nativa chama /api/rides sem cookie nenhum, então o
// proxy não pode exigir sessão de cookie aqui nem redirecionar pra /login
// (isso quebraria a chamada nativa devolvendo HTML em vez de JSON).
const SELF_AUTHENTICATED_API_PATHS = ["/api/webhooks/kiwify", "/api/rides"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  if (matchesPath(request.nextUrl.pathname, SELF_AUTHENTICATED_API_PATHS)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (matchesPath(request.nextUrl.pathname, PUBLIC_PATHS)) return response;
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Sessão única: compara o token desta sessão com o registrado no perfil.
  // Um novo login em outro dispositivo sobrescreve active_session_id, o que
  // invalida automaticamente todas as demais sessões abertas.
  const sessionCookie = request.cookies.get("lr_session_id")?.value;

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_session_id, access_expires_at")
    .eq("id", user.id)
    .single();

  const sessionIsValid =
    !!sessionCookie && !!profile?.active_session_id && sessionCookie === profile.active_session_id;

  if (!sessionIsValid) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "session_replaced");
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.cookies.delete("lr_session_id");
    return redirectResponse;
  }

  // Acesso por 1 ano a partir da compra/renovação — se expirar com a
  // sessão ainda aberta (usuário usando o app há mais de um ano seguido),
  // derruba na próxima navegação em vez de esperar um novo login.
  if (profile.access_expires_at && new Date(profile.access_expires_at) < new Date()) {
    await supabase.auth.signOut();
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "access_expired");
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.cookies.delete("lr_session_id");
    return redirectResponse;
  }

  if (matchesPath(request.nextUrl.pathname, PUBLIC_PATHS)) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
