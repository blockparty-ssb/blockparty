'use strict'
const { ipcRenderer, shell } = require('electron')
const mutantValue = require('mutant/value')
const { div, button, img, p, h2, h3, section, input } =
  require('../html-helpers')
const labels = require('./labels').wizard

module.exports = function (state) {
  const appIdObs = mutantValue()
  const apiKeyObs = mutantValue()
  const wizardPages = {
    enterName: section('.wizard-page', [
      img('.logo', {attributes: {src: 'styles/img/logo.png'}}),
      div('.wrapper', [
        h2(labels.enterAppId),
        input('#wizard-app-id'),
        button('.button-continue', {'ev-click': () => {
          appIdObs.set(document.getElementById('wizard-app-id').value)
          pageObs.set(wizardPages.hasAccount)
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
            apiKeyObs.set(document.getElementById('wizard-api-key').value)
            pageObs.set(wizardPages.confirmation)
          }}, labels.continue),
          makeCancelButton()
        ])
      ])
    ]),
    confirmation: section('.wizard-page', [
      div('.wrapper', [
        h2(labels.confirmation),
        p(appIdObs),
        p(apiKeyObs),
        button('.button-continue', {'ev-click': () => {
          ipcRenderer.send('create-network', {
            appName: appIdObs(),
            apiToken: apiKeyObs()
          })
          pageObs.set(wizardPages.wait)
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
  const pageObs = mutantValue(wizardPages.enterName)

  function makeCancelButton() {
    return button('.button-cancel', {'ev-click': () => {
      delete state.wizard.appId
      delete state.wizard.apiKey
      if (state.apps) {
        pageObs.set(wizardPages.enterName)
      } else {
        state.wizardActive = false
      }
    }}, labels.cancel)
  }

  return div('#wizard-view', pageObs)
}

