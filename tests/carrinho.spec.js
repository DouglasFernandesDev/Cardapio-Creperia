import { test, expect } from '@playwright/test';

test.describe('Carrinho', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Cada teste começa com o localStorage limpo, para não herdar carrinho de outro teste.
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('adiciona um item e atualiza contador e subtotal', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();

    await expect(page.locator('#contador-carrinho')).toHaveText('1');

    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    await expect(page.getByRole('dialog', { name: 'Seu carrinho' })).toBeVisible();
    await expect(page.locator('#carrinho-subtotal')).toHaveText('Subtotal: R$ 19,90');
  });

  test('aumenta e diminui a quantidade pelo stepper', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();

    await page.getByRole('button', { name: 'Aumentar quantidade de Napolitano' }).click();
    await expect(page.locator('#carrinho-subtotal')).toHaveText('Subtotal: R$ 39,80');

    await page.getByRole('button', { name: 'Diminuir quantidade de Napolitano' }).click();
    await expect(page.locator('#carrinho-subtotal')).toHaveText('Subtotal: R$ 19,90');
  });

  test('remover a última unidade pelo stepper esvazia o carrinho', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();

    await page.getByRole('button', { name: 'Diminuir quantidade de Napolitano' }).click();
    await expect(page.locator('#carrinho-vazio')).toBeVisible();
    await expect(page.locator('#contador-carrinho')).toBeHidden();
  });

  test('mesma observação agrupa quantidade; observação diferente cria linha separada', async ({ page }) => {
    const card = page.locator('.card-produto', { hasText: 'Napolitano' });

    await card.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
    await card.getByPlaceholder('Observação (opcional): sem cebola, bem passado...').fill('sem cebola');
    await card.getByRole('button', { name: 'Adicionar ao carrinho' }).click();

    await expect(page.locator('#contador-carrinho')).toHaveText('2');
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    await expect(page.locator('.linha-carrinho')).toHaveCount(2);
    await expect(page.locator('.linha-carrinho__obs')).toHaveText('Obs: sem cebola');
  });

  test('carrinho sobrevive a um reload da página', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Guaravita' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await expect(page.locator('#contador-carrinho')).toHaveText('1');

    await page.reload();
    await expect(page.locator('#contador-carrinho')).toHaveText('1');
  });

  test('remover item pelo botão "Remover" some da lista', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();

    await page.getByRole('button', { name: 'Remover Napolitano do carrinho' }).click();
    await expect(page.locator('#carrinho-vazio')).toBeVisible();
  });
});
