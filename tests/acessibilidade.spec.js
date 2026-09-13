import { test, expect } from '@playwright/test';

test.describe('Acessibilidade dos painéis (carrinho e checkout)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('abrir o carrinho move o foco para dentro do dialog nativo', async ({ page }) => {
    const botaoAbrir = page.getByRole('button', { name: 'Abrir carrinho' });
    await botaoAbrir.click();

    const dialog = page.getByRole('dialog', { name: 'Seu carrinho' });
    await expect(dialog).toBeVisible();

    const focoDentroDoDialog = await page.evaluate(() => {
      const dialog = document.getElementById('dialog-carrinho');
      return dialog.contains(document.activeElement);
    });
    expect(focoDentroDoDialog).toBe(true);
  });

  test('Esc fecha o carrinho e devolve o foco ao botão que abriu', async ({ page }) => {
    const botaoAbrir = page.getByRole('button', { name: 'Abrir carrinho' });
    await botaoAbrir.click();
    await expect(page.getByRole('dialog', { name: 'Seu carrinho' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Seu carrinho' })).toBeHidden();
    await expect(botaoAbrir).toBeFocused();
  });

  test('clicar fora do conteúdo (no backdrop) fecha o dialog de checkout', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    await page.getByRole('button', { name: 'Finalizar pedido' }).click();

    const dialog = page.getByRole('dialog', { name: 'Finalizar pedido' });
    await expect(dialog).toBeVisible();

    // Clica num canto do viewport, fora da caixa de conteúdo do dialog.
    await page.mouse.click(2, 2);
    await expect(dialog).toBeHidden();
  });

  test('botão fechar (×) fecha o checkout', async ({ page }) => {
    await page
      .locator('.card-produto', { hasText: 'Napolitano' })
      .getByRole('button', { name: 'Adicionar ao carrinho' })
      .click();
    await page.getByRole('button', { name: 'Abrir carrinho' }).click();
    await page.getByRole('button', { name: 'Finalizar pedido' }).click();

    await page.getByRole('button', { name: 'Fechar formulário de pedido' }).click();
    await expect(page.getByRole('dialog', { name: 'Finalizar pedido' })).toBeHidden();
  });

  test('link "pular para o conteúdo" recebe foco com Tab e aponta para o cardápio', async ({ page }) => {
    await page.keyboard.press('Tab');
    const link = page.getByRole('link', { name: 'Pular para o cardápio' });
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute('href', '#cardapio');
  });
});
