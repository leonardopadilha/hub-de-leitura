import { test } from '../../fixtures/fixture';

test('Should click on book catalog button', async ({ homePage, catalogPage }) => {
  await homePage.clickOnBookCatalog()
  await catalogPage.expectPageTitle('Conheça Nosso Acervo')
  await catalogPage.bookListIsVisibleAndNotEmpty()
})
