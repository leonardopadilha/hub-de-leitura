import { Locator, Page, expect } from "@playwright/test";

export default class HomePage {
  private readonly page: Page
  private readonly btnRegister: Locator

  constructor(page: Page) {
    this.page = page
    this.btnRegister = page.getByRole('link', { name: 'Criar Conta Grátis' });
  }

  async visitar() {
    await this.page.goto('/')
  }

  async clickOnRegister() {
    await this.btnRegister.click()
  }
}