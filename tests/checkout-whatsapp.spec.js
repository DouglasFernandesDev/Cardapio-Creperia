import { test, expect } from '@playwright/test';

/** Preenche o carrinho e abre o checkout, deixando o formulário pronto para preencher. */
async function abrirCheckoutComItem(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page
    .locator('.card-produto', { hasText: 'Napolitano' })
    .getByRole('button', { name: 'Adicionar ao carrinho' })
    .click();
  await page.getByRole('button', { name: 'Abrir carrinho' }).click();
  await page.getByRole('button', { name: 'Finalizar pedido' }).click();
}

test.describe('Checkout e envio para o WhatsApp', () => {
  test('formulário inválido (campos vazios) não abre o WhatsApp', async ({ page }) => {
    await page.addInitScript(() => {
      window.__aberturas = [];
      window.open = (url) => window.__aberturas.push(url);
    });
    await abrirCheckoutComItem(page);

    await page.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }).click();

    const aberturas = await page.evaluate(() => window.__aberturas);
    expect(aberturas).toHaveLength(0);
  });

  test('troco menor que o total é rejeitado com aviso, sem abrir o WhatsApp', async ({ page }) => {
    await abrirCheckoutComItem(page);
    await page.evaluate(() => {
      window.__aberturas = [];
      window.open = (url) => window.__aberturas.push(url);
    });

    await page.getByLabel('Nome').fill('Maria Teste');
    await page.getByLabel('Telefone (WhatsApp)').fill('22999991234');
    await page.locator('#select-bairro').selectOption('Braga');
    await page.getByLabel('Rua e número').fill('Rua das Flores, 100');
    await page.locator('#select-pagamento').selectOption('Dinheiro');
    await page.locator('#campo-troco').fill('10');

    await page.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }).click();

    await expect(page.locator('.toast--erro')).toContainText('troco');
    const aberturas = await page.evaluate(() => window.__aberturas);
    expect(aberturas).toHaveLength(0);
  });

  test('pedido válido monta a URL do WhatsApp com itens, frete e total corretos', async ({ page }) => {
    await abrirCheckoutComItem(page);
    await page.evaluate(() => {
      window.__aberturas = [];
      window.open = (url) => window.__aberturas.push(url);
    });
    page.on('dialog', (dialog) => dialog.accept());

    await page.getByLabel('Nome').fill('Maria Teste');
    await page.getByLabel('Telefone (WhatsApp)').fill('22999991234');
    await page.locator('#select-bairro').selectOption('Braga'); // 2.0km → R$ 5,00
    await page.getByLabel('Rua e número').fill('Rua das Flores, 100');
    await page.locator('#select-pagamento').selectOption('Pix');

    await page.getByRole('button', { name: 'Enviar pedido pelo WhatsApp' }).click();

    const aberturas = await page.evaluate(() => window.__aberturas);
    expect(aberturas).toHaveLength(1);

    // Intl.NumberFormat('pt-BR') usa espaço não separável (U+00A0) entre "R$" e o
    // valor — bom para tipografia (não quebra linha entre símbolo e número), mas
    // precisa ser normalizado para comparar com os espaços comuns usados abaixo.
    const espacoNaoSeparavel = String.fromCharCode(160);
    const mensagem = decodeURIComponent(aberturas[0].split('text=')[1]).replaceAll(espacoNaoSeparavel, ' ');
    expect(aberturas[0]).toContain('https://wa.me/5522998712898');
    expect(mensagem).toContain('1x Napolitano');
    expect(mensagem).toContain('Subtotal: R$ 19,90');
    expect(mensagem).toContain('Entrega (Braga, ~2 km): R$ 5,00');
    expect(mensagem).toContain('TOTAL: R$ 24,90');
    expect(mensagem).toContain('Nome: Maria Teste');
    expect(mensagem).toContain('Pix');

    // O carrinho é limpo após a confirmação do usuário.
    await expect(page.locator('#contador-carrinho')).toBeHidden();
  });
});
