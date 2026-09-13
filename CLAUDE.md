# Project: Sagrado Creperia — Cardápio Digital

## Tech Stack

### Instalado
- HTML5 semântico
- CSS3 — Custom Properties (variáveis), Flexbox, Grid, Container Queries
- JavaScript (ES6+, Vanilla — sem frameworks)
- Playwright (testes E2E)
- ESLint — lint de JavaScript (`eslint.config.js`, flat config)
- Stylelint — lint de CSS (`.stylelintrc.json`, `stylelint-config-standard`)
- `live-server` — servidor de desenvolvimento com live reload

### Planejada (ainda não instalada)
> Adotar conforme a necessidade. Instalar a dependência **antes** de referenciá-la em código ou nas regras.
- Prettier — formatação automática de código
- Vite — se o projeto crescer além do que `live-server` cobre bem
- Web Components (`customElements`) ou templates JS — se precisar de componentização sem framework

## Commands
- `npx live-server` (ou `npx vite`) — servidor local com live reload
- `npx eslint .` — lint de JavaScript
- `npx stylelint "**/*.css"` — lint de CSS
- `npx prettier --check .` / `npx prettier --write .` — checagem/formatação de código
- `npx playwright test <arquivo>` — Playwright, um arquivo por vez

## Architecture
- Estrutura de projeto estático, organizada por tipo de arquivo na raiz:
  - `index.html` — página principal; demais páginas ficam na raiz ou em subpastas por seção (`sobre/index.html`, `contato/index.html`)
  - `css/` — folhas de estilo; `css/base.css` (reset + variáveis), `css/layout.css`, `css/components/` para estilos por componente
  - `js/` — scripts; `js/main.js` como ponto de entrada, `js/data/` para dados do negócio (config da loja, cardápio), `js/modules/` para módulos ES6 importados via `import`/`export`
  - `imagens/` — logo, cardápio de referência e fotos de produto (pasta única de mídia deste projeto; substitui o `assets/images/` genérico porque já era onde o dono do site depositava os arquivos antes deste CLAUDE.md existir)
  - `tests/` — testes Playwright (`tests/<nome>.spec.js`)
- JavaScript organizado em módulos ES6 (`<script type="module" src="js/main.js">`) — evita poluir o escopo global
- CSS organizado por camadas: variáveis/tokens → reset → layout → componentes → utilitários
- Sem lógica de servidor: tudo roda no navegador. Se precisar de backend/API, documentar endpoint e método de chamada (`fetch`) aqui quando for adicionado

## Code Style
- HTML: tags semânticas (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`) em vez de `<div>` genérico sempre que houver equivalente
- Acessibilidade: todo `<img>` com `alt`; inputs com `<label>` associado; usar atributos `aria-*` quando o HTML semântico não for suficiente
- CSS: nomenclatura de classes em BEM (`bloco__elemento--modificador`); usar Custom Properties (`--cor-primaria`) para tokens de design em vez de valores soltos; mobile-first (media queries com `min-width`)
- JavaScript: ES6+ (`const`/`let`, nunca `var`); arrow functions onde fizer sentido; módulos ES (`import`/`export`), sem `require()`
- Sem CSS inline (`style="..."`) e sem JS inline (`onclick="..."`) — manter separação entre estrutura, estilo e comportamento
- Nomes de arquivo: kebab-case (`menu-principal.js`, `card-produto.css`)

## Dados do Negócio
- Toda informação específica da loja (WhatsApp, endereço, coordenadas, horário de funcionamento, faixas de frete por km, bairros atendidos, formas de pagamento) fica centralizada em `js/data/config.js` — é o único arquivo a editar para ajustar esses valores, sem tocar em lógica
- O cardápio (itens, descrições, preços em centavos) fica em `js/data/cardapio.js`, transcrito do flyer oficial da loja (`imagens/cardapio.jpeg`)
- Atendimento é **somente delivery**, às sextas, sábados e domingos (não há opção de retirada no balcão) — confirmado com o dono da loja em 13/09/2026
- Valores marcados com o comentário `// CONFIRMAR` em `config.js` são placeholders (endereço exato, faixas de frete, horário por dia) até o dono da loja confirmar os números reais

## Environment Variables
- Projeto estático não tem `.env` por padrão — se adotar um bundler (Vite), usar `import.meta.env` e prefixo `VITE_PUBLIC_*` para valores expostos ao client
- **Nunca** colocar chaves/segredos em JavaScript do lado do cliente: qualquer coisa em `js/` é pública e visível no navegador (não existe "server-side" aqui, diferente de Next.js/Server Actions)
- Se precisar de chamadas autenticadas a uma API, isso exige um backend próprio (fora do escopo deste stack) — documentar separadamente se for adicionado

## Workflow
- ALWAYS rodar `npx eslint .` e `npx stylelint "**/*.css"` após uma série de mudanças
- Rodar um teste por vez, não o suite completo: `npx playwright test tests/NomeDoArquivo.spec.js`
- Validar visualmente em pelo menos dois navegadores (Chrome + Firefox) antes de considerar uma tela pronta
- Branch naming: `feat/`, `fix/`, `chore/` + descrição em kebab-case
- Commits em inglês, imperativo: "add mobile nav toggle"

## Common Gotchas
- Abrir `index.html` direto via `file://` quebra `fetch`/módulos ES por CORS — sempre usar um servidor local (`live-server`, `vite`, etc.)
- Scripts que manipulam o DOM devem rodar após o DOM carregar: usar `defer` no `<script>` ou ouvir `DOMContentLoaded`
- Caminhos de assets: preferir caminhos relativos à raiz do site (`/assets/...`) e conferir se batem com a estrutura de pastas ao publicar (GitHub Pages, Netlify etc. podem mudar a raiz)
- `<script type="module">` já é `defer` por padrão e roda em modo estrito — cuidado com `this` no escopo global
- Cache agressivo do navegador durante o desenvolvimento pode esconder mudanças em CSS/JS — usar hard refresh ou parâmetro de versão no link do arquivo
- `[hidden]` pode parar de funcionar: se uma classe do componente define `display` (ex.: `.campo { display: flex }`), ela empata em especificidade com o `[hidden] { display: none }` do user-agent e vence por vir depois na cascata — o elemento fica com o atributo `hidden`, mas continua visível. Correção aplicada em `css/base.css`: `[hidden] { display: none !important; }` no reset global
- Drawer do carrinho e modal de checkout usam `<dialog>` nativo (`showModal()`/`close()`) em vez de focus trap reimplementado — o navegador já cuida de foco preso, fechar com Esc e devolver o foco. Para detectar clique no backdrop e fechar, comparar `evento.target === dialog`, nunca `evento.target.closest(...)`: se o clique disparar uma re-renderização síncrona que troca o DOM (ex.: `replaceChildren` ao mudar a quantidade no carrinho), o elemento clicado já está desanexado da árvore quando o evento termina de borbulhar, e `closest()` falha silenciosamente
- `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` usa espaço não separável (U+00A0) entre "R$" e o valor, não um espaço comum — em testes que comparam a string formatada, normalizar (`.replaceAll(String.fromCharCode(160), ' ')`) antes de comparar

## Git Commits

NEVER run Git commit directly. ALWAYS use the commit skill for every git commit in this project, regardless of how the user requested it.
This applies to:

Explicit requests: "faz o commit", "commita", commit das mudanças"
Implícito requests: "salva", "finaliza a feature", "pode subir"
Any situation where you would naturally run git commit

The commit skill enforces Conventional Commits specification and ansiares consistent commit history across the project.