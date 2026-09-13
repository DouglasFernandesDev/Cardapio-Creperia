---
name: teste-responsivo
description: >
  Prepara e conduz o teste do site em celular real (mesma rede Wi-Fi ou túnel
  público) e a varredura prévia de responsividade por emulação. Dispara em:
  "testar no celular", "abrir no meu telefone", "teste em dispositivo real",
  "responsividade", "mobile", "quebrou no celular", "testar em iPhone/Android".
---

# Teste em Celular Real

## Objetivo

Emulador não reproduz teclado virtual, barra de endereço que some, notch, toque impreciso nem rede lenta. Esta skill faz duas coisas: **varre por emulação** o que dá para pegar automaticamente, e depois **coloca o site no celular do usuário** com um roteiro de verificação.

> **Idioma:** comunicação com o usuário em **PT-BR**.

---

## Etapa 1 — Varredura por emulação (antes de incomodar o celular)

Rode o que é automatizável primeiro; leve para o device só o que sobrou.

Com `npm run dev` rodando, use o Playwright (já instalado) ou o MCP do Chrome DevTools para checar nos tamanhos 360×640, 390×844, 414×896 e 768×1024:

- **scroll horizontal** — o sintoma mais comum. Verificação direta no console:
  ```js
  document.documentElement.scrollWidth > document.documentElement.clientWidth
  ```
  Se `true`, ache o culpado:
  ```js
  [...document.querySelectorAll("*")].filter(
    (el) => el.getBoundingClientRect().right > document.documentElement.clientWidth
  );
  ```
- **alvos de toque** — todo elemento clicável com menos de 44×44 px é reprovado.
- **texto** — nada abaixo de 14px; corpo idealmente 16px.
- **imagens** — sem `max-width: 100%` estourando o container.

Corrija o que aparecer aqui antes da Etapa 2.

---

## Etapa 2 — Servir o dev server para a rede local

### 2.1 Subir escutando em todas as interfaces

```bash
npm run dev -- -H 0.0.0.0
```

Sem `-H 0.0.0.0` o Next escuta só em `localhost` e o celular não enxerga.

### 2.2 Descobrir o IP da máquina (Windows)

```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback|WSL|vEthernet" }).IPAddress
```

Pegue o endereço da rede local — tipicamente `192.168.x.x`. O terminal do Next também imprime esse endereço como **Network** ao subir; conferir ali é o caminho mais rápido.

### 2.3 Liberar no firewall (só na primeira vez)

O Firewall do Windows costuma bloquear a porta 3000 para outros dispositivos. Peça ao usuário para rodar num **PowerShell como administrador** (não execute por ele — exige elevação):

```powershell
New-NetFirewallRule -DisplayName "Next dev 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Private
```

> Regra restrita ao perfil **Private**. Não aplique em rede pública, e remova depois com `Remove-NetFirewallRule -DisplayName "Next dev 3000"` se for um ambiente compartilhado.

### 2.4 Abrir no celular

Instrua: conectar o celular **na mesma rede Wi-Fi** e abrir `http://SEU_IP:3000`.

Se não carregar, nesta ordem:
1. celular está no Wi-Fi (não no 4G)?
2. o roteador tem *isolamento de clientes* ("AP isolation") ligado?
3. VPN ativa no celular ou no PC?
4. o dev subiu com `-H 0.0.0.0`?

### 2.5 Alternativa — fora da rede local

Para testar em 4G, em celular de outra pessoa ou em iPhone com rede corporativa:

```bash
npx localtunnel --port 3000
```

ou `cloudflared tunnel --url http://localhost:3000`.

**Avise antes de usar:** isso publica o site em uma URL pública temporária, acessível por qualquer um com o link. Não use com dados reais de cliente e derrube o túnel ao terminar. Peça confirmação do usuário antes de abrir qualquer túnel.

### 2.6 Testar o build de produção, não só o dev

Muita coisa (imagens otimizadas, fontes, tamanho do JS) só se comporta de verdade em produção:

```bash
npm run build && npm run start -- -H 0.0.0.0
```

Faça a passagem final do roteiro nesse modo.

---

## Etapa 3 — Roteiro no aparelho

Entregue esta lista ao usuário e **peça o resultado item a item** — não presuma aprovação.

**Layout**
- [ ] Nenhum scroll horizontal em nenhuma seção
- [ ] Nada cortado ou sobreposto em portrait **e** landscape
- [ ] Conteúdo não fica embaixo do notch / barra inferior (`env(safe-area-inset-*)` quando necessário)
- [ ] Altura de tela cheia usa `100dvh`, não `100vh` (o `100vh` erra com a barra do navegador)

**Toque**
- [ ] Botões e links acertáveis com o polegar na primeira tentativa
- [ ] Espaçamento suficiente entre alvos vizinhos
- [ ] Nada depende de `hover` para funcionar
- [ ] CTA principal alcançável sem reposicionar a mão

**Formulários** (quando existirem)
- [ ] Teclado virtual não tampa o campo em foco
- [ ] `inputMode`/`type` corretos (`tel` para telefone, `email` para e-mail)
- [ ] Inputs com `font-size` ≥ 16px — abaixo disso o iOS dá zoom sozinho
- [ ] Dá para fechar o teclado e enviar

**Desempenho percebido**
- [ ] Primeira carga aceitável no 4G (teste desligando o Wi-Fi)
- [ ] Sem salto de layout enquanto carrega (imagens com `width`/`height` ou `fill`)
- [ ] Fontes não piscam de forma agressiva

**Navegadores**
- [ ] Chrome no Android **e** Safari no iOS — Safari é onde quebra o que ninguém testou
- [ ] Se possível, um aparelho antigo/barato além do principal

---

## Etapa 4 — Fechamento

1. Anote cada item reprovado com tela, seção e o que aconteceu.
2. Corrija e repita **só** os itens reprovados.
3. Derrube o túnel, se usou, e remova a regra de firewall se for temporária.
4. Relate ao usuário o que passou e o que foi corrigido — sem afirmar aprovação em item que não foi testado no aparelho.
