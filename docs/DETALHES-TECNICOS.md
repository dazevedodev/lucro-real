# Lucro Real: detalhes técnicos

## Como rodar

#### 1. Criar o projeto Supabase

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. Rode as migrations contra esse projeto:
   ```bash
   npx supabase link --project-ref <seu-project-ref>
   npx supabase db push
   ```
   (isso aplica `supabase/migrations/` e popula o catálogo de carros via `supabase/seed.sql`)
3. Copie `.env.local.example` para `.env.local` e preencha com as chaves do projeto (Project Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (usada só no webhook — nunca expor no client)

#### 2. Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem usuário nenhum criado ainda — veja abaixo como criar um de teste.

#### 3. Webhook da Kiwify (criar usuário + enviar credenciais)

`/api/webhooks/kiwify` cria o acesso (Supabase Auth) e envia a senha temporária por e-mail via Resend. Configure no dashboard da Kiwify um webhook para o trigger `compra_aprovada` apontando para:

```
https://SEU_DOMINIO/api/webhooks/kiwify?token=SEU_KIWIFY_WEBHOOK_SECRET
```

O `token` na query string é um segredo nosso (não da Kiwify) — comparado contra `KIWIFY_WEBHOOK_SECRET` no `.env.local`.

**Importante:** a doc pública da Kiwify não deixa 100% claro o formato exato do payload do evento de compra aprovada. O handler tenta extrair e-mail/status de vários formatos plausíveis e **loga o payload cru** a cada chamada — use o botão "testar webhook" do dashboard da Kiwify pra disparar um evento real, conferir o log do servidor, e ajustar `extractEmail`/`extractStatus` em [`src/app/api/webhooks/kiwify/route.ts`](src/app/api/webhooks/kiwify/route.ts) se os campos não baterem.

Pra testar localmente sem a Kiwify:

```bash
curl -X POST "http://localhost:3000/api/webhooks/kiwify?token=SEU_KIWIFY_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"motorista@exemplo.com","status":"paid"}'
```

Sem `RESEND_API_KEY` configurada, a senha temporária só aparece no log do servidor (`npm run dev`) em vez de ser enviada por e-mail — dá pra testar o fluxo inteiro sem conta no Resend.

## Catálogo de consumo por modelo

Fonte editável: [`supabase/seed-data/car-models.json`](supabase/seed-data/car-models.json). Depois de editar, regenere o seed com:

```bash
node scripts/generate-car-catalog-seed.mjs
npx supabase db push
```

## App Android (Capacitor + bolha flutuante)

O WebView do app Android carrega o servidor real (`capacitor.config.ts` → `server.url`) em vez de um build estático — o app usa Server Actions/Server Components/proxy do Next.js, incompatíveis com `next export`. Trocar `server.url` de produção pela URL do Vercel antes de gerar um APK de release.

A bolha flutuante (permissão "exibir sobre outros apps" + formulário rápido + voz) é um plugin nativo Kotlin em `android/app/src/main/java/br/com/lucroreal/app/bubble/`. Ela autentica direto com a API (`/api/rides`) via Bearer token, fora da WebView — por isso existe `/api/session` (entrega o token pra bolha depois do login) e a mesma trava de sessão única do web é replicada lá via header `X-Session-Id`.

Build (precisa de Android Studio/JDK 17+/SDK instalados):

```bash
npx cap sync android
npx cap open android
```

Limitação conhecida do reconhecimento de voz: só entende números já transcritos como dígitos pelo Android (ex. "25"), não números por extenso ("vinte e cinco").

## O que falta (backlog conhecido)

- Confirmar o payload real do webhook da Kiwify com um teste disparado pelo dashboard deles (ver seção acima) e apontar o webhook de lá para a URL de produção.
- Conta real no Resend (`RESEND_API_KEY`) para o envio de e-mail deixar de ser simulado.
- Trocar `SessionStore` (Android) de SharedPreferences simples para EncryptedSharedPreferences antes de um release de verdade.
- Gerar build de release assinado do Android (hoje só existe debug, testado em emulador).

## Deploy

Produção: **https://lucro-real-seven.vercel.app** (projeto `zantte/lucro-real` no Vercel, deployado via `vercel --prod`). Variáveis de ambiente de produção já configuradas (Supabase, `KIWIFY_WEBHOOK_SECRET` próprio de produção, `NEXT_PUBLIC_APP_URL`) — gerenciar via `vercel env ls` / `vercel env add`. `capacitor.config.ts` já aponta pra essa URL quando `CAP_ENV=production`.
