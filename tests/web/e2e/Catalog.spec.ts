import { test } from '../../fixtures/fixture';  

test('Should search for a book', async ({ catalogPage }) => {
  await catalogPage.visitar()
  await catalogPage.searchForABook()
  await catalogPage.clickOnBookDetails()
})