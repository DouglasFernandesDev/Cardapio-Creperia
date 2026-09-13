import { test, expect } from '@playwright/test';

test.describe('Cálculo de frete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('bairro dentro da 1ª faixa (até 3km) mostra o valor correto', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    await page.getByRole('button', { name: 'Finalizar pedido' }).click();

    await page.locator('#select-bairro').selectOption('Braga'); // 2.0 km → faixa até 3km
    await expect(page.locator('#resultado-frete')).toContainText('R$ 5,00');
    await expect(page.locator('#checkout-resumo-total')).toHaveText('Total: R$ 24,90');
  });

  test('bairro na faixa intermediária (3–6km) mostra o valor correto', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    await page.getByRole('button', { name: 'Finalizar pedido' }).click();

    await page.locator('#select-bairro').selectOption('Ogiva'); // 4.9 km → faixa até 6km
    await expect(page.locator('#resultado-frete')).toContainText('R$ 8,00');
  });

  test('bairro na faixa mais distante (6–10km) mostra o valor correto', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    await page.getByRole('button', { name: 'Finalizar pedido' }).click();

    await page.locator('#select-bairro').selectOption('Peró'); // 7.5 km → faixa até 10km
    await expect(page.locator('#resultado-frete')).toContainText('R$ 12,00');
  });

  test('resolverFrete acusa fora de área acima da última faixa', async ({ page }) => {
    const resultado = await page.evaluate(async () => {
      const { resolverFrete } = await import('/js/modules/frete.js');
      return resolverFrete(15);
    });
    expect(resultado.foraDeArea).toBe(true);
  });

  test('resolverFretePorBairro com bairro desconhecido acusa fora de área', async ({ page }) => {
    const resultado = await page.evaluate(async () => {
      const { resolverFretePorBairro } = await import('/js/modules/frete.js');
      return resolverFretePorBairro('Bairro Que Não Existe');
    });
    expect(resultado.foraDeArea).toBe(true);
  });

  test('calcularDistanciaKm retorna 0 para o mesmo ponto', async ({ page }) => {
    const km = await page.evaluate(async () => {
      const { calcularDistanciaKm } = await import('/js/modules/frete.js');
      const ponto = { lat: -22.8894, lng: -42.0286 };
      return calcularDistanciaKm(ponto, ponto);
    });
    expect(km).toBeCloseTo(0, 5);
  });

  test('geolocalização negada cai no select de bairro sem quebrar a página', async ({ page, context }) => {
    await context.grantPermissions([]); // garante que a permissão não foi concedida
    await page.addInitScript(() => {
      // Simula o navegador negando a permissão de localização.
      navigator.geolocation.getCurrentPosition = (_sucesso, erro) => erro({ code: 1, message: 'Permissão negada' });
    });
    await page.goto('/');

    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    await page.getByRole('button', { name: 'Finalizar pedido' }).click();

    await page.getByRole('button', { name: 'Usar minha localização' }).click();
    await expect(page.locator('.toast--erro')).toBeVisible();
    // O select de bairro continua disponível e funcional.
    await page.locator('#select-bairro').selectOption('Centro');
    await expect(page.locator('#resultado-frete')).toContainText('R$ 5,00');
  });
});
