import { Locator, Page, expect } from "@playwright/test";

export default class LoginPage {
  private readonly page: Page
  private readonly titleRegistrationForm: Locator
  private readonly inputEmail: Locator
  private readonly inputPassword: Locator
  private readonly btnLogin: Locator
  private readonly alertMessage: Locator
  private readonly alertSuccessLogin: Locator

  constructor(page: Page) {
    this.page = page
    this.titleRegistrationForm = page.locator('.login-header h2')
    this.inputEmail = page.getByPlaceholder('seu@email.com')
    this.inputPassword = page.getByPlaceholder('Sua senha')
    this.btnLogin = page.getByRole('button', { name: 'Entrar' })
    this.alertMessage = page.locator('.alert-danger')
    this.alertSuccessLogin = page.locator('.alert-success')
  }

  async visitar() {
    await this.page.goto('/login.html')
  }

  async expectTitleRegistrationForm(text: string) {
    const titleForm = await this.titleRegistrationForm.textContent()
    await expect(titleForm).toEqual(text)
  }

  async fillForm(email: string, password: string) {
    await this.inputEmail.fill(email)
    await this.inputPassword.fill(password)
    await this.btnLogin.click()
  }

  async expectAlertMessage(message: string) {
    const alertMessage = await this.alertMessage.textContent()
    await expect(alertMessage).toContain(message)
  }

  async expectAlertSuccessLogin(message: string) {
    await expect(await this.alertSuccessLogin).toBeVisible()
    await expect(await this.alertSuccessLogin).toContainText(message)
  }
}