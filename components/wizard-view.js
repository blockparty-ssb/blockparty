'use strict'
const { ipcRenderer, shell } = require('electron')
const h = require('hyperscript')
const { div, button, img, p, h2, section } =
  require('hyperscript-helpers')(h)
const textField = require('./input-field')
const labels = require('./labels').wizard

module.exports = function (state, emit) {
  const activePage = state.wizard.activePage || 'enterName'
  const wizardPages = {
    enterName: section('.enter-name-page',
      img('.logo', `src='styles/img/logo.png'`),
      div('.wrapper',
        h2(labels.enterAppId),
        textField({id: 'wizard-app-id'}),
        button(labels.continue, { onclick: () => {
          state.wizard.appId = document.getElementById('wizard-app-id').value
          goTo('hasAccount')
        }}))
    ),
    hasAccount: div(labels.haveAccount,
      button(labels.accountYes, { id: '1', onclick: () => goTo('apiKey')}),
      button(labels.accountNo), { id: 'no-account', onclick: () => goTo('getAccount')}
    ),
    getAccount: div(
      p(labels.getDOAccount),
      button(labels.goToDO, { id: 'make-account', onclick: () => shell.openExternal(labels.dOURL)}),
      button(labels.madeAccount, { id: 'made-account', onclick: () => goTo('apiKey')})
    ),
    apiKey: div(labels.giveApiKey,
      textField({id: 'wizard-api-key'}),
      button(labels.continue, {id: '2', onclick: () => {
        state.wizard.apiKey = document.getElementById('wizard-api-key').value
        goTo('confirmation')
      }})
    ),
    confirmation: div(labels.confirmation,
      p(state.wizard.appId),
      p(state.wizard.apiKey),
      button(labels.yesCreate, {onclick: () => {
        ipcRenderer.send('create-network', {
          appName: state.wizard.appId,
          apiToken: state.wizard.apiKey
        })
      }}),
      button(labels.cancel)
    )
  }

  function goTo(pageName) {
    state.wizard.activePage = pageName
    emit('render')
  }

  const currentWizardPage = wizardPages[activePage]
  return div('#wizard-view', currentWizardPage)
}
