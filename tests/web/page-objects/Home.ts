import { Locator, Page, expect } from "@playwright/test";

export default class HomePage {
  private readonly page: Page
  private readonly btnRegister: Locator
  private readonly btnBookCatalog: Locator

  constructor(page: Page) {
    this.page = page
    this.btnRegister = page.getByRole('link', { name: 'Criar Conta Grátis' });
    this.btnBookCatalog = page.getByRole('button', { name: /Explorar Catálogo/i})
  }

  async visitar() {
    await this.page.goto('/')
      // Expect a title "to contain" a substring.
    await expect(this.page).toHaveURL(/localhost/);
    
    const pageTitle = await this.page.locator('.logo-section h1').textContent();
    await expect(pageTitle).toEqual('Hub de Leitura');
  }

  async clickOnRegister() {
    await this.btnRegister.click()
  }

  async clickOnBookCatalog() {
    await this.btnBookCatalog.click()
  }
}