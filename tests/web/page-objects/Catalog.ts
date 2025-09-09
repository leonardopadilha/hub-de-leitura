import { Locator, Page, expect } from "@playwright/test";
import idBook from '../../utils/idBook'

export default class CatalogPage {
  private readonly page: Page
  private inputSearch: Locator
  private readonly pageTitle: Locator
  private readonly bookList: Locator
  private readonly btnBookDetails: Locator

  constructor(page: Page) {
    this.page = page
    this.inputSearch = page.getByPlaceholder('Buscar por título, autor ou ISBN…')
    this.pageTitle = page.locator('#catalogo h2')
    this.bookList = page.locator('#book-list .card-body')
    this.btnBookDetails = page.getByRole('button', { name: 'Ver Detalhes' })
  }

  async visitar() {
    await this.page.goto('/catalog.html')
  }

  async expectPageTitle(title: string) {
    //O matcher toContainText só existe para Locator, não para string
    await expect(this.pageTitle).toContainText(title)
  }

  private async countBookList(qtBooks: number) {
    const elementsList = await this.bookList.count()
    expect(elementsList).toBe(qtBooks)
  }

  async bookListIsVisibleAndNotEmpty() {
    await expect(this.bookList.first()).toBeVisible()
    await this.countBookList(12)
  }

  async searchForABook() {    
    // innerText() já retorna sempre string (nunca null):
    const bookToSearch = await this.page.locator('#book-list .card-body h5').nth(idBook).innerText()

  /*
    .replace(/\s+/g, " ")
        /\s+/g é uma expressão regular:
        \s → significa qualquer espaço em branco (inclui espaço, tabulação \t, quebra de linha \n, etc).
        + → significa um ou mais (pega blocos de espaços).
        g → significa global, ou seja, substitui todos os casos encontrados.

    .trim() -> Remove espaços em branco no início e no fim da string.
  */

    const bookNormalized = bookToSearch?.replace(/\s+/g, " ").trim()
    await this.inputSearch.fill(bookNormalized)

    await expect(this.page.locator('#filter-status .alert-info')).toContainText(`Filtros ativos: Busca: "${bookNormalized}"`)
    await expect(this.page.locator('#results-count')).toContainText('Exibindo 1 de 1 livros')
    await this.countBookList(1)
  }

  async clickOnBookDetails() {
    await this.btnBookDetails.click()
    await expect(this.page.url()).toContain('/book-details.html')
  }

}