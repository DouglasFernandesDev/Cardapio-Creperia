---
name: paginas-de-estado
description: >
  Cria e revisa as páginas de estado do App Router: 404 (not-found),
  erro de rota (error), erro global / 500 (global-error) e carregamento
  (loading). Dispara em: "criar página 404", "página de erro", "página 500",
  "estado de carregamento", "skeleton", "loading state", "tela de erro",
  "not-found", "error boundary". Use antes de publicar qualquer rota nova.
---

# Páginas de Estado (App Router)

## Objetivo

Garantir que toda rota tenha comportamento definido quando algo **não existe**, **falha** ou **ainda está carregando** — em vez da tela padrão do Next, que é genérica e em inglês.

> **Idioma:** toda comunicação com o usuário em **PT-BR**. O texto das páginas também em PT-BR (`lang="pt-BR"` no projeto).

---

## Mapa dos arquivos

| Arquivo | O que cobre | Tipo |
|---|---|---|
| `app/not-found.tsx` | 404 — rota inexistente ou `notFound()` chamado | Server Component |
| `app/error.tsx` | Erro não tratado dentro do segmento (mantém o layout) | **Client** (`"use client"`) |
| `app/global-error.tsx` | Erro que quebra o root layout — **é a "página 500"** | **Client** (`"use client"`) |
| `app/loading.tsx` | Fallback de Suspense enquanto o segmento renderiza | Server Component |

Podem existir por segmento: `app/dashboard/error.tsx` só cobre `/dashboard`. O mais próximo vence.

---

## Passo 1 — Levantar o que falta

```bash
ls app/not-found.tsx app/error.tsx app/global-error.tsx app/loading.tsx 2>/dev/null
```

Crie apenas o que não existe. Se já existir, revise contra o checklist final em vez de sobrescrever.

---

## Passo 2 — `app/not-found.tsx` (404)

Server Component. Não recebe props. Responde com status **404**.

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-neutral-500">Erro 404</p>
      <h1 className="text-3xl font-bold tracking-tight">Página não encontrada</h1>
      <p className="max-w-prose text-neutral-600">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Voltar para a página inicial
      </Link>
    </main>
  );
}
```

**Regras**
- Sem `"use client"` — não há interatividade aqui.
- Sempre ofereça uma saída (link para a home e/ou para a seção principal).
- Para disparar manualmente: `import { notFound } from "next/navigation"` e chame `notFound()` no Server Component.

**Opcional — 404 global sem o root layout:** existe `app/global-not-found.tsx` (precisa de `<html>` e `<body>` próprios), mas na versão instalada (Next 16.3.2) ele é **experimental e vem desligado**. Só use se habilitar em `next.config.ts`:

```ts
const nextConfig: NextConfig = { experimental: { globalNotFound: true } };
```

Se não for habilitar, ignore esse arquivo — `app/not-found.tsx` já resolve.

---

## Passo 3 — `app/error.tsx` (erro do segmento)

Error boundaries **precisam** ser Client Components.

```tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Trocar por Sentry.captureException(error) se a skill `monitoramento` já rodou
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Algo deu errado</h1>
      <p className="max-w-prose text-neutral-600">
        Não conseguimos carregar esta parte da página. Tente novamente.
      </p>
      {error.digest && (
        <p className="text-xs text-neutral-400">Código: {error.digest}</p>
      )}
      <button
        onClick={() => retry()}
        className="mt-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Tentar novamente
      </button>
    </main>
  );
}
```

**Regras**
- A prop de recuperação no Next 16 chama-se **`retry`**. `reset` ainda é passado como alias legado — código antigo com `reset` continua funcionando, mas **escreva `retry` em código novo**.
- **Nunca** renderize `error.message` cru para o usuário: em produção a mensagem de erro do servidor é substituída por um texto genérico + `digest`, e mostrar detalhe de erro vaza informação. Mostre o `digest`, que é o que liga ao log.
- `app/error.tsx` **não** captura erros lançados no root layout nem no próprio `error.tsx` — isso é trabalho do `global-error.tsx`.

---

## Passo 4 — `app/global-error.tsx` (a página 500)

No App Router **não existe `500.tsx`** — isso era Pages Router. O `global-error.tsx` é o equivalente: no `npm run build` o Next renderiza esse componente e grava o resultado como `500.html` estático, servido com status 500 para clientes sem JavaScript.

Como ele substitui o root layout, precisa trazer `<html>` e `<body>` e importar os estilos globais.

```tsx
"use client";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center antialiased">
        <p className="text-sm font-medium text-neutral-500">Erro 500</p>
        <h1 className="text-3xl font-bold tracking-tight">Erro interno do servidor</h1>
        <p className="max-w-prose text-neutral-600">
          Tivemos um problema inesperado. Já estamos olhando isso.
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-400">Código: {error.digest}</p>
        )}
        <button
          onClick={() => retry()}
          className="mt-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
```

**Regras**
- Não dependa de fontes, contexto ou providers do root layout — ele não existe nesse ponto.
- Mantenha o markup simples: essa página tem que funcionar justamente quando o resto quebrou.

---

## Passo 5 — `app/loading.tsx` (carregamento)

Vira automaticamente um `<Suspense>` em volta do segmento.

```tsx
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] flex-col gap-4 px-6 py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando conteúdo…</span>
      <div className="h-8 w-2/3 animate-pulse rounded-md bg-neutral-200" />
      <div className="h-4 w-full animate-pulse rounded-md bg-neutral-200" />
      <div className="h-4 w-5/6 animate-pulse rounded-md bg-neutral-200" />
    </div>
  );
}
```

**Regras**
- Skeleton no formato do conteúdo real (evita salto de layout / CLS). Não use spinner genérico em página inteira.
- Sempre marque acessibilidade: `aria-busy`, `aria-live` e um texto em `sr-only`.
- Numa landing page estática o `loading.tsx` raramente aparece — só crie por segmento que realmente busca dados no servidor.

---

## Passo 6 — Estados de erro e carregamento **dentro** dos componentes

Os arquivos acima cobrem a rota inteira. Para ações do usuário (formulário, botão que chama Server Action), o estado é local:

- carregando: `useActionState` / `useFormStatus` (`pending`) desabilitando o botão e trocando o rótulo;
- erro: mensagem próxima ao campo, com `aria-describedby`, vinda do retorno tipado da Server Action (`{ success, message, errors }`, conforme `.claude/rules/rules-global.md`);
- nunca deixe o botão clicável duas vezes durante o envio.

---

## Passo 7 — Verificar

```bash
npm run type-check && npm run lint
npm run build
```

Depois, com `npm run dev`:

1. acesse uma rota inexistente (ex.: `/rota-que-nao-existe`) → deve cair no seu 404;
2. force um erro num Server Component (`throw new Error("teste")`) → deve cair no `error.tsx`, com o layout preservado; **remova o throw depois**;
3. confira que `.next/server/pages/500.html` foi gerado pelo build → é o `global-error.tsx` renderizado.

Relate ao usuário o que foi criado e o resultado real de cada teste — sem afirmar que passou sem ter rodado.

---

## Checklist final

- [ ] `app/not-found.tsx` existe, é Server Component e tem link de saída
- [ ] `app/error.tsx` tem `"use client"` e usa a prop `retry`
- [ ] Nenhuma página expõe `error.message` cru ao usuário
- [ ] `app/global-error.tsx` tem `"use client"`, `<html lang="pt-BR">`, `<body>` e importa `globals.css`
- [ ] `loading.tsx` (onde faz sentido) com skeleton e acessibilidade
- [ ] Textos em PT-BR e no tom do produto (ver `PRODUCT.md`)
- [ ] `npm run type-check && npm run lint` limpos
