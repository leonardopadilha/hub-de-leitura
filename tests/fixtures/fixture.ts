import { test as base } from '@playwright/test';
import HomePage from '../web/page-objects/Home';
import LoginPage from '../web/page-objects/Login';
import DashboardPage from '../web/page-objects/Dashboard';
import CatalogPage from '../web/page-objects/Catalog';

export const test = base.extend<{
  homePage: HomePage,
  loginPage: LoginPage,
  dashboardPage: DashboardPage,
  catalogPage: CatalogPage
}>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page)
    await homePage.visitar()
    await use(homePage)
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await use(loginPage)
  },
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page)
    //await dashboardPage.visitar()
    await use(dashboardPage)
  },
  catalogPage: async ({ page }, use) => {
    const catalogPage = new CatalogPage(page)
    await use(catalogPage)
  }
})