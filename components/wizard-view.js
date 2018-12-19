'use strict'
const { ipcRenderer, shell } = require('electron')
const mutantValue = require('mutant/value')
const { div, button, img, p, h2, h3, section, input } =
  require('../html-helpers')
const labels = require('./labels').wizard
const joinNetwork = require('../join-network')

module.exports = function (state) {
  const appIdObs = mutantValue()
  const apiKeyObs = mutantValue()
  const wizardPages = {
    enterName: section('.wizard-page', [
      div('.wrapper', [
        h2('Create a new community or join an existing one!'),
        div('.box', [
          h3(labels.enterAppId),
          input('#wizard-app-id', {attributes: {required: true}}),
          button('.button-continue', {'ev-click': () => {
            const wizardInput = document.getElementById('wizard-app-id').value
            if (!wizardInput) {
              return
            }
            appIdObs.set(wizardInput)
            pageObs.set(wizardPages.hasAccount)
          }}, labels.continue)
        ]),
        div('.box', [
          h3(labels.enterInvite),
          input('#invite-code'),
          button('.button-continue', {'ev-click': () => {
            const inviteCode = document.getElementById('invite-code').value
            if (!inviteCode) return
            joinNetwork(inviteCode, function(err, success) {
              if (err) console.log(err)
              console.log(success)
            })
          }}, labels.continue)
        ])
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
          makeCancelButton(),
          button('.button-continue', {'ev-click': () => {
            apiKeyObs.set(document.getElementById('wizard-api-key').value)
            pageObs.set(wizardPages.confirmation)
          }}, labels.continue)
        ])
      ])
    ]),
    confirmation: section('.wizard-page', [
      div('.wrapper', [
        h2(labels.confirmation),
        div('.box', [
          p(appIdObs),
        p(apiKeyObs),
        makeCancelButton(),
        button('.button-continue', {'ev-click': () => {
          ipcRenderer.send('create-network', {
            appName: appIdObs(),
            apiToken: apiKeyObs()
          })
          pageObs.set(wizardPages.wait)
        }}, labels.yesCreate)
        ])
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
