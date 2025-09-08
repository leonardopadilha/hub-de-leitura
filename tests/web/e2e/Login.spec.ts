import { test } from '../../fixtures/fixture';
const users = require('../../fixtures/users.json');

const MESSAGE_LOGIN_INVALID = 'Email ou senha incorretos.'
const MESSAGE_LOGIN_SUCCESS = 'Login realizado com sucesso!'

test("Should not login with wrong credentials", async ({ homePage, loginPage }) => {
  const user = users.wrong_credentials

  await homePage.clickOnRegister()
  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertMessage(MESSAGE_LOGIN_INVALID)
})

test("Should not login with wrong email", async ({ homePage, loginPage }) => {
  const user = users.wrong_email

  await homePage.clickOnRegister()
  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertMessage(MESSAGE_LOGIN_INVALID)
})

test("Should not login with wrong password", async ({ homePage, loginPage }) => {
  const user = users.wrong_password

  await homePage.clickOnRegister()
  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertMessage(MESSAGE_LOGIN_INVALID)
})

test("Should login success with common user", async ({ homePage, loginPage }) => {
  const user = users.common_user

  await homePage.clickOnRegister()
  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertSuccessLogin(MESSAGE_LOGIN_SUCCESS)
})

test("Should login success with admin user", async ({ homePage, loginPage }) => {
  const user = users.admin_user

  await homePage.clickOnRegister()
  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertSuccessLogin(MESSAGE_LOGIN_SUCCESS)
})