import { test } from '../../fixtures/fixture';
const users = require('../../fixtures/users.json');

const MESSAGE_LOGIN_INVALID = 'Email ou senha incorretos.'
const MESSAGE_LOGIN_SUCCESS = 'Login realizado com sucesso!'

test.beforeEach(async ({ homePage }) => {
  await homePage.clickOnRegister()
})

test("Should not login with wrong credentials", async ({ loginPage }) => {
  const user = users.wrong_credentials

  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertMessage(MESSAGE_LOGIN_INVALID)
})

test("Should not login with wrong email", async ({ loginPage }) => {
  const user = users.wrong_email

  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertMessage(MESSAGE_LOGIN_INVALID)
})

test("Should not login with wrong password", async ({ loginPage }) => {
  const user = users.wrong_password

  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertMessage(MESSAGE_LOGIN_INVALID)
})

test("Should login success with common user", async ({ loginPage, dashboardPage }) => {
  const user = users.common_user

  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertSuccessLogin(MESSAGE_LOGIN_SUCCESS)
  await dashboardPage.userTypeLogged(user.logged)
})

test("Should login success with admin user", async ({ loginPage, dashboardPage }) => {
  const user = users.admin_user

  await loginPage.expectTitleRegistrationForm('Entre com sua conta')
  await loginPage.fillForm(user.email, user.password)
  await loginPage.expectAlertSuccessLogin(MESSAGE_LOGIN_SUCCESS)
  await dashboardPage.userTypeLogged(user.logged)
})