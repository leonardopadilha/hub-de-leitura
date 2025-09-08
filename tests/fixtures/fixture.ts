import { test as base } from '@playwright/test';
import HomePage from '../web/page-objects/Home';
import LoginPage from '../web/page-objects/Login';

export const test = base.extend<{
  homePage: HomePage,
  loginPage: LoginPage
}>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page)
    await homePage.visitar()
    await use(homePage)
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await use(loginPage)
  }
})