---
name: analytics-lgpd
description: >
  Instala Google Analytics 4 no App Router com banner de consentimento de
  cookies em conformidade com a LGPD (Consent Mode v2, nada dispara antes do
  aceite). Dispara em: "google analytics", "GA4", "gtag", "cookies", "banner de
  cookies", "LGPD", "consentimento", "política de privacidade", "rastreamento".
---

# Google Analytics + Consentimento (LGPD)

## Objetivo

Medir audiência **sem** ferir a LGPD. A regra que orienta tudo aqui: cookie de analytics só existe **depois** do aceite livre e informado — e recusar tem que ser tão fácil quanto aceitar.

> **Idioma:** comunicação e textos do banner em **PT-BR**.

---

## Passo 0 — Alinhar com o usuário antes de codar

Pergunte e **espere resposta**:

1. Qual o ID de medição do GA4 (formato `G-XXXXXXXXXX`)? Sem ele não dá para concluir.
2. Existe **Política de Privacidade** publicada? O banner precisa linkar para uma. Se não existir, avise que é obrigatório pela LGPD (art. 9º — informação clara sobre finalidade) e ofereça criar a rota `/politica-de-privacidade`.
3. Vai usar Google Tag Manager? Se sim, configure o GA **dentro do GTM** e não instale os dois separados.

---

## Passo 1 — Dependência e env

```bash
npm install @next/third-parties
```

`.env.example` e `.env.local`:

```
# ID de medição do Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

É `NEXT_PUBLIC_` de propósito: o ID aparece no HTML, não é segredo. **Nenhuma** outra credencial de analytics (API secret do Measurement Protocol, por exemplo) pode levar esse prefixo.

---

## Passo 2 — Consent Mode v2 antes de qualquer script

O gtag precisa saber que o padrão é **negado** antes de carregar. No `app/layout.tsx`, dentro do `<head>`, com `next/script` em `beforeInteractive`:

```tsx
import Script from "next/script";

<Script id="consent-default" strategy="beforeInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500
    });
  `}
</Script>
```

Quando o usuário aceitar, o banner chama:

```ts
window.gtag?.("consent", "update", { analytics_storage: "granted" });
```

---

## Passo 3 — Componente de consentimento

Como é reutilizável em todo o site, vai na raiz: `components/cookie-consent.tsx` (Client Component).

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "consentimento-cookies";
const VERSAO_POLITICA = "2026-09-12"; // trocar quando a política mudar

type Consentimento = { analytics: boolean; versao: string; data: string };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function CookieConsent({ onAceitar }: { onAceitar: () => void }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (!salvo) return setVisivel(true);

    try {
      const consentimento = JSON.parse(salvo) as Consentimento;
      if (consentimento.versao !== VERSAO_POLITICA) return setVisivel(true);
      if (consentimento.analytics) onAceitar();
    } catch {
      setVisivel(true);
    }
  }, [onAceitar]);

  function registrar(analytics: boolean) {
    const consentimento: Consentimento = {
      analytics,
      versao: VERSAO_POLITICA,
      data: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentimento));
    if (analytics) {
      window.gtag?.("consent", "update", { analytics_storage: "granted" });
      onAceitar();
    }
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="titulo-cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="titulo-cookies" className="text-sm font-semibold">
            Usamos cookies
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Usamos cookies de análise para entender como o site é usado e melhorá-lo.
            Você pode recusar sem perder nenhuma funcionalidade. Saiba mais na{" "}
            <Link href="/politica-de-privacidade" className="underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => registrar(false)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Recusar
          </button>
          <button
            onClick={() => registrar(true)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Regras de conformidade (não negociáveis)**
- "Recusar" com o **mesmo peso visual** de "Aceitar". Nada de recusa escondida em "preferências".
- Sem pré-marcação e sem *cookie wall*: recusar não pode bloquear o conteúdo.
- Nenhum script de analytics antes do aceite — nem "só o pageview".
- Guarde **data e versão** do consentimento; ao mudar a política, incremente `VERSAO_POLITICA` e pergunte de novo.
- O usuário precisa conseguir **revogar** depois: deixe um link "Preferências de cookies" no rodapé que limpa a chave e reexibe o banner.
- Fechar no "X" ou rolar a página **não** é consentimento.

---

## Passo 4 — Carregar o GA só depois do aceite

Componente que junta banner + GA — `components/analytics.tsx`:

```tsx
"use client";

import { useCallback, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CookieConsent } from "./cookie-consent";

export function Analytics() {
  const [permitido, setPermitido] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const aceitar = useCallback(() => setPermitido(true), []);

  return (
    <>
      <CookieConsent onAceitar={aceitar} />
      {permitido && gaId && <GoogleAnalytics gaId={gaId} />}
    </>
  );
}
```

E no `app/layout.tsx`, dentro do `<body>`, depois de `{children}`:

```tsx
<Analytics />
```

O `layout.tsx` continua Server Component — quem tem `"use client"` é o componente importado.

---

## Passo 5 — Eventos personalizados

Na landing page, o que vale medir são os CTAs ("Ligar agora", "Agende um horário"):

```tsx
import { sendGAEvent } from "@next/third-parties/google";

<a href="tel:..." onClick={() => sendGAEvent("event", "clique_ligar", { origem: "hero" })}>
```

Só dispare em componente client, e lembre: sem consentimento o GA não está carregado e o evento simplesmente não vai — comportamento correto, não bug.

---

## Passo 6 — Verificar

```bash
npm run type-check && npm run lint
npm run build
```

No navegador, com DevTools aberto:

1. Aba anônima → banner aparece; em **Network**, filtrar por `google-analytics` / `gtag` → **nenhuma** requisição antes do clique.
2. Clicar em **Recusar** → banner some, continua sem requisição; recarregar não reexibe.
3. Limpar o `localStorage`, clicar em **Aceitar** → aí sim `gtag/js` carrega; conferir Tempo Real no painel do GA4.
4. Em **Application → Local Storage**, confirmar o registro com `data` e `versao`.

Relate o que foi observado de fato em cada passo.

---

## Checklist final

- [ ] `NEXT_PUBLIC_GA_ID` em `.env.example` e `.env.local`
- [ ] Consent Mode com tudo `denied` por padrão, antes de qualquer script
- [ ] Nenhuma requisição ao Google antes do aceite (verificado no Network)
- [ ] "Recusar" tão visível quanto "Aceitar"
- [ ] Link para a Política de Privacidade funcionando
- [ ] Consentimento gravado com data e versão; revogação possível pelo rodapé
- [ ] `npm run type-check && npm run lint` limpos
