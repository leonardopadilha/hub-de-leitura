import { Locator, Page, expect } from "@playwright/test";

export default class DashboardPage {
  private readonly page: Page
  private userLogged: Locator

  constructor(page: Page) {
    this.page = page
    this.userLogged = page.locator('a[class^="user-info"] span')
  }

  async visitar() {
    await this.page.goto('/dashboard.html')
  }

  async userTypeLogged(username: string) {
    const user = await this.userLogged.textContent()
    await expect(user).toEqual(username)
  }
}