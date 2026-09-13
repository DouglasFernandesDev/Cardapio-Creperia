---
name: monitoramento
description: >
  Configura monitoramento de erros (Sentry no App Router) e de disponibilidade
  (health check + monitor de uptime externo com alertas). Dispara em: "Sentry",
  "monitorar erros", "error tracking", "uptime", "o site caiu", "health check",
  "alerta de queda", "observabilidade", "logs de produção".
---

# Monitoramento de Erros e Disponibilidade

## Objetivo

Saber que algo quebrou **antes** do cliente avisar. Duas frentes complementares:

- **Erros** — exceções em Server Components, Server Actions, Route Handlers e no browser (Sentry).
- **Disponibilidade** — o site responde? (health check + monitor externo).

> **Idioma:** comunicação com o usuário em **PT-BR**.

---

## Passo 0 — Alinhar com o usuário

Pergunte e **espere resposta**:

1. Já existe conta no Sentry? Precisa de: **DSN**, **org slug** e **project slug**.
2. Onde o site está hospedado (Vercel, VPS, outro)? Muda a instrução de env var e de uptime.
3. Para onde os alertas devem ir (e-mail, WhatsApp, Slack)?

Sem DSN não dá para concluir a parte de erros — faça a parte de uptime e deixe a de Sentry pendente, dizendo isso claramente.

---

## Parte A — Sentry (erros)

### A.1 Instalar

```bash
npm install @sentry/nextjs
```

O assistente oficial (`npx @sentry/wizard@latest -i nextjs`) também funciona e escreve os arquivos sozinho. Se o usuário preferir o wizard, use-o e depois **revise** os arquivos gerados contra o checklist final.

### A.2 Variáveis de ambiente

`.env.example`:

```
# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

- `NEXT_PUBLIC_SENTRY_DSN` — público, vai no bundle do browser por definição.
- `SENTRY_AUTH_TOKEN` — **segredo**, usado só no build para subir source maps. Nunca com prefixo `NEXT_PUBLIC_`. Em CI/Vercel, cadastre como variável de ambiente protegida.

### A.3 Arquivos de configuração

`sentry.server.config.ts` (raiz):

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
});
```

`sentry.edge.config.ts` (raiz): mesmo conteúdo — roda no runtime edge (middleware).

`instrumentation-client.ts` (raiz) — é o arquivo do cliente no Next 15+/16, substituiu o antigo `sentry.client.config.ts`:

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: process.env.NODE_ENV === "production",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

`instrumentation.ts` (raiz):

```ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captura erros de Server Components, middleware e proxies
export const onRequestError = Sentry.captureRequestError;
```

**Importante:** `enabled: process.env.NODE_ENV === "production"` evita poluir o painel com erros de desenvolvimento. Para testar o envio em local, troque temporariamente para `true` e reverta depois.

### A.4 `next.config.ts`

```ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "SEU_ORG_SLUG",
  project: "SEU_PROJECT_SLUG",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/monitoring-tunnel",
  silent: !process.env.CI,
});
```

`tunnelRoute` faz as requisições passarem pelo seu domínio — sem isso, bloqueadores de anúncio engolem boa parte dos eventos do browser.

### A.5 Ligar no `global-error.tsx`

Se a skill `paginas-de-estado` já rodou, o arquivo existe — acrescente a captura, mantendo o `retry`:

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  // …mesma UI da skill paginas-de-estado
}
```

Faça o mesmo no `app/error.tsx`, trocando o `console.error` por `Sentry.captureException(error)`.

### A.6 Privacidade

O Sentry captura contexto da requisição. Antes de publicar:

- não envie dados pessoais em `setUser` além de um ID interno;
- se usar Session Replay, ligue a máscara de texto e de mídia (padrão do SDK) — não a desative;
- cite o Sentry como operador na Política de Privacidade (relevante para a LGPD; ver skill `analytics-lgpd`).

---

## Parte B — Disponibilidade (uptime)

### B.1 Rota de health check

`app/api/health/route.ts`:

```ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
```

- `force-dynamic` + `no-store` são obrigatórios: uma rota cacheada responde "ok" mesmo com o backend morto.
- Quando houver banco (Supabase), faça um `select 1` aqui e devolva **503** se falhar — assim o monitor detecta queda de dependência, não só do servidor.
- Não exponha versão, variáveis de ambiente ou stack nessa resposta.
- Se a skill `seo-setup` já rodou, `/api/` já está no `disallow` do `robots.ts`. Confirme.

### B.2 Monitor externo

Configuração manual do usuário; conduza:

1. Criar conta em um monitor (UptimeRobot, Better Stack e Vercel Monitoring têm plano gratuito).
2. Novo monitor **HTTP(S)** apontando para `https://SEU_DOMINIO/api/health`.
3. Intervalo de 5 minutos (suficiente no plano free).
4. Alerta esperando status **200** e o texto `"status":"ok"` no corpo.
5. Destino do alerta conforme respondido no Passo 0.
6. Adicionar um segundo monitor na home (`/`) — pega o caso de a app subir mas a página quebrar.
7. Ativar monitor de expiração de **certificado SSL** e de **domínio**, se a ferramenta oferecer.

### B.3 Alertas que não viram ruído

- Notificar só após **2 falhas consecutivas** (evita alarme por instabilidade de rede).
- No Sentry, criar alerta para **nova issue** e para **pico de erros**, não para toda ocorrência.
- Revisar semanalmente o que chegou. Alerta que todo mundo ignora é pior do que não ter alerta.

---

## Passo final — Verificar

```bash
npm run type-check && npm run lint
npm run build
```

Testes reais:

1. Criar uma rota temporária que lança erro (`throw new Error("teste-sentry")`), acessar em produção/preview e confirmar que a issue **apareceu no painel do Sentry**. Apagar a rota depois.
2. `curl -i https://SEU_DOMINIO/api/health` → 200 com `no-store`.
3. Pausar/derrubar o serviço por um instante (se houver ambiente de teste) e confirmar que o alerta chegou ao destino.
4. Conferir no build que os source maps subiram (log do Sentry no final do `npm run build`).

Só declare que funciona depois de ver a issue no painel e o alerta chegando — configuração escrita não é monitoramento comprovado.

---

## Checklist final

- [ ] `@sentry/nextjs` instalado e DSN em `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_AUTH_TOKEN` fora do bundle (sem `NEXT_PUBLIC_`) e cadastrado no host
- [ ] `instrumentation.ts` com `register()` e `onRequestError`
- [ ] `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` criados
- [ ] `withSentryConfig` no `next.config.ts` com `tunnelRoute`
- [ ] `error.tsx` e `global-error.tsx` capturando para o Sentry
- [ ] `/api/health` com `force-dynamic` + `no-store`, fora do índice
- [ ] Monitor externo ativo em `/api/health` e em `/`, com alerta testado
- [ ] Erro de teste visto no painel e rota de teste removida
