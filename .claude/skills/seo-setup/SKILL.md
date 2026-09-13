---
name: seo-setup
description: >
  Configura o SEO técnico do site: metadata e Open Graph/Twitter no App Router,
  imagem de compartilhamento, sitemap.xml, robots.txt e o cadastro no Google
  Search Console. Dispara em: "metadata", "SEO", "open graph", "OG image",
  "preview do link", "sitemap", "robots.txt", "search console", "indexar no
  Google", "meta tags".
---

# SEO Técnico (metadata, OG, sitemap, robots, Search Console)

## Objetivo

Fazer o site ser **indexável**, **compartilhável** (preview correto no WhatsApp/Instagram/LinkedIn) e **monitorável** no Google Search Console.

> **Idioma:** comunicação com o usuário em **PT-BR**. Conteúdo das meta tags em PT-BR (público brasileiro).

---

## Passo 0 — Definir a URL canônica

Tudo aqui depende do domínio final. Pergunte ao usuário se ainda não souber; **não invente domínio**.

Adicione em `.env.example` e `.env.local`:

```
# URL pública do site, sem barra no final
NEXT_PUBLIC_SITE_URL=https://www.exemplo.com.br
```

É `NEXT_PUBLIC_` porque é público por natureza (aparece no HTML). No código:

```ts
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
```

---

## Passo 1 — Metadata no root layout

Em `app/layout.tsx`, expanda o `export const metadata`:

```ts
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pet Shop Feliz — Banho, tosa, veterinário e hospedagem",
    template: "%s | Pet Shop Feliz",
  },
  description:
    "Banho e tosa, consultas veterinárias, hospedagem e loja de produtos. Cuidado familiar e personalizado para o seu pet.",
  applicationName: "Pet Shop Feliz",
  keywords: ["petshop", "banho e tosa", "veterinário", "hotel para pets"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Pet Shop Feliz",
    title: "Pet Shop Feliz — cuidado de verdade para o seu pet",
    description:
      "Banho e tosa, consultas veterinárias, hospedagem e loja de produtos em um só lugar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pet Shop Feliz",
    description: "Banho, tosa, veterinário e hospedagem para o seu pet.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};
```

**Regras**
- `metadataBase` é obrigatório para que imagens e canonical relativos virem URL absoluta. Sem ele o Next avisa no build.
- Confirme nome, descrição e dados de contato com `PRODUCT.md` antes de escrever — ali está o nome oficial e o que ainda é placeholder.
- `title.template` só se aplica a rotas filhas que definem o próprio `title`.
- Em rotas específicas, exporte `metadata` (estático) ou `generateMetadata` (dinâmico) no `page.tsx`.

---

## Passo 2 — Imagem de compartilhamento (OG image)

Duas opções. Prefira a **estática** quando houver arte pronta.

**A. Arquivo estático** — coloque em `app/`:
- `app/opengraph-image.png` (1200×630)
- `app/opengraph-image.alt.txt` com o texto alternativo
- opcional: `app/twitter-image.png`

O Next detecta pela convenção de nome e gera as tags sozinho.

**B. Gerada em build** — `app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pet Shop Feliz — banho, tosa, veterinário e hospedagem";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "white",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        Pet Shop Feliz
        <div style={{ fontSize: 30, fontWeight: 400, marginTop: 16 }}>
          Banho · Tosa · Veterinário · Hospedagem
        </div>
      </div>
    ),
    size
  );
}
```

**Regras**
- `ImageResponse` aceita um subconjunto de CSS: use `display: flex` explícito em todo container com mais de um filho; sem Tailwind aqui (é Satori, não o browser).
- Nada de texto essencial nas bordas — alguns apps recortam.

---

## Passo 3 — `app/sitemap.ts`

```ts
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
```

Serve em `/sitemap.xml`. Liste **uma entrada por rota indexável** — em site de rotas dinâmicas, gere a lista a partir do banco/CMS. Não inclua rotas privadas, de teste ou com `noindex`.

---

## Passo 4 — `app/robots.ts`

```ts
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

Serve em `/robots.txt`. Use `.ts` em vez de um arquivo estático em `public/` — assim o domínio acompanha a env e não fica hardcoded.

> Ambiente de preview/homologação não deve ser indexado. Se houver, condicione: quando `NEXT_PUBLIC_SITE_URL` não for o domínio de produção, retorne `{ rules: { userAgent: "*", disallow: "/" } }`.

---

## Passo 5 — Verificar antes de publicar

```bash
npm run build && npm run start
```

Em outro terminal:

```bash
curl -s localhost:3000/robots.txt
curl -s localhost:3000/sitemap.xml | head -20
curl -s localhost:3000 | grep -Eo '<meta[^>]*(og:|twitter:|description)[^>]*>'
```

Confirme: nenhuma URL `localhost` vazando (se estiver testando com env de produção), canonical presente, `og:image` apontando para uma imagem que abre no navegador.

Depois do deploy, valide o preview real em: compartilhador do Facebook, Post Inspector do LinkedIn e mandando o link para você mesmo no WhatsApp. Caches de preview são agressivos — revalide pelas ferramentas ao mudar a imagem.

---

## Passo 6 — Google Search Console

Passos manuais do usuário; conduza um a um e **espere a confirmação de cada um** antes de seguir.

1. Acessar <https://search.google.com/search-console> e adicionar propriedade.
   - **Domínio** (cobre www, sem-www, http e https) → exige registro TXT no DNS. Recomendada.
   - **Prefixo de URL** → aceita verificação por meta tag, mais simples sem acesso ao DNS.
2. Se escolher meta tag, o Google dá um código. Adicione no metadata do root layout:

```ts
export const metadata: Metadata = {
  // …
  verification: { google: "COLE_AQUI_O_CODIGO" },
};
```

   Isso gera `<meta name="google-site-verification" content="…">`.
3. **Fazer deploy** — a verificação lê o site publicado, não o localhost.
4. Clicar em "Verificar" no Search Console.
5. Em **Sitemaps**, enviar `sitemap.xml`.
6. Em **Inspeção de URL**, testar a home e pedir indexação.

Avise o usuário que indexação leva de horas a dias, e que a meta tag de verificação deve **permanecer** no site.

---

## Checklist final

- [ ] `NEXT_PUBLIC_SITE_URL` no `.env.example` e `.env.local`
- [ ] `metadataBase`, `title`, `description`, `alternates.canonical` no root layout
- [ ] `openGraph` + `twitter` com locale `pt_BR`
- [ ] Imagem OG 1200×630 com `alt`, abrindo em URL absoluta
- [ ] `app/sitemap.ts` respondendo em `/sitemap.xml`
- [ ] `app/robots.ts` respondendo em `/robots.txt`, apontando o sitemap
- [ ] Preview validado em pelo menos uma rede social real
- [ ] Propriedade verificada no Search Console e sitemap enviado
- [ ] `npm run type-check && npm run lint` limpos
