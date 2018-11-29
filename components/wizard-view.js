'use strict'
const { ipcRenderer, shell } = require('electron')
const computed = require('mutant/computed')
const { div, button, img, p, h2, h3, section, input } =
  require('../html-helpers')
const labels = require('./labels').wizard


module.exports = function (state) {
  const currentWizardPageObs = computed([state.wizard.activePage], activePageName => {
    if (!activePageName) return wizardPages.enterName
    return wizardPages[activePageName]
  })
  const wizardPages = {
    enterName: section('.wizard-page', [
      img('.logo', {attributes: {src: 'styles/img/logo.png'}}),
      div('.wrapper', [
        h2(labels.enterAppId),
        input('#wizard-app-id'),
        button('.button-continue', {'ev-click': () => {
          state.wizard.appId = document.getElementById('wizard-app-id').value
          goTo('hasAccount')
        }}, labels.continue)
      ])
    ]),
    hasAccount: section('.wizard-page', [
      div('.wrapper', [
        h2(labels.haveAccount),
        div('.box', [
          h3(labels.accountNo),
          p(labels.getDOAccount),
          button('#make-account', {'ev-click': () => shell.openExternal(labels.dOURL)}, labels.goToDO)
        ]),
        div('.box', [
          h3(labels.accountYes),
          p(labels.giveApiKey),
          input({id: 'wizard-api-key'}),
          button('.button-continue', {'ev-click': () => {
            state.wizard.apiKey = document.getElementById('wizard-api-key').value
            goTo('confirmation')
          }}, labels.continue),
          makeCancelButton()
        ])
      ])
    ]),
    confirmation: section('.wizard-page', [
      div('.wrapper', [
        h2(labels.confirmation),
        p(state.wizard.appId),
        p(state.wizard.apiKey),
        button('.button-continue', {'ev-click': () => {
          ipcRenderer.send('create-network', {
            appName: state.wizard.appId,
            apiToken: state.wizard.apiKey
          })
          goTo('wait')
        }}, labels.yesCreate),
        makeCancelButton()
      ])
    ]),
    wait: section('.wizard-page', [
      div('.wrapper', [
        h2(labels.paintWhileWaiting),
        p(labels.takeSomeTime)
      ])
    ])
  }

  function goTo(pageName) {
    state.wizard.activePage.set(pageName)
  }

  function makeCancelButton() {
    return button('.button-cancel', {'ev-click': () => {
      delete state.wizard.appId
      delete state.wizard.apiKey
      if (state.apps) {
        goTo('enterName')
      } else {
        state.wizardActive = false
      }
    }}, labels.cancel)
  }

  return div('#wizard-view', currentWizardPageObs)
}

