# Sagrado Creperia — Cardápio Digital

Cardápio digital da Sagrado Creperia (Cabo Frio - RJ): carrinho de compras, cálculo de
frete por distância (bairro ou geolocalização) e envio do pedido pronto para o
WhatsApp da loja. Site estático (HTML, CSS e JavaScript puro), sem backend.

## Como rodar localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:8080`. **Não abra `index.html` direto pelo navegador**
(`file://`) — os módulos JavaScript (`type="module"`) só funcionam servidos por HTTP.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor local com live reload |
| `npm run lint` | Lint de JavaScript (ESLint) |
| `npm run lint:css` | Lint de CSS (Stylelint) |
| `npm test` | Testes end-to-end (Playwright, Chromium + Firefox) |

Para rodar um arquivo de teste específico: `npx playwright test tests/carrinho.spec.js`.

## Editando dados da loja

Todo dado específico do negócio fica em dois arquivos, sem precisar tocar em lógica:

- **`js/data/config.js`** — WhatsApp, endereço, coordenadas, horário de funcionamento,
  faixas de frete por km e bairros atendidos. Valores ainda não confirmados estão
  marcados com o comentário `// CONFIRMAR`.
- **`js/data/cardapio.js`** — itens do cardápio, descrições e preços (em centavos).

Veja `CLAUDE.md` para a arquitetura completa do projeto e convenções de código.
