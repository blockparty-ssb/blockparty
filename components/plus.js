'use strict'
const { ipcRenderer } = require('electron')
const mutantValue = require('mutant/value')
const computed = require('mutant/computed')
const { div, button, h2, h3, section, input } =
  require('../html-helpers')
const {wizard} = require('../labels')
const joinNetwork = require('../join-network')
const startApp = require('../start-app')
const showError = require('../show-do-error')
const pubWizard = require('../../ssb-pub-wizard')

const pageObs = mutantValue('createOrJoin')

module.exports.renderWizard = function (state) {
  const wizardPages = {
    createOrJoin: section('.wizard-page', [
      div('.wrapper', [
        h2('Create a new community or join an existing one!'),
        div('.box', [
          h3(wizard.createNew),
          button('.button-continue .app-button', {'ev-click': () => {
            pageObs.set('pubWizard')
          }}, wizard.create)
        ]),
        div('.box', [
          h3(wizard.enterInvite),
          input('#invite-code'),
          button('.button-continue .app-button', {'ev-click': () => {
            const spinner = document.getElementById('loader')
            spinner.style.display = 'block'
            const inviteCode = document.getElementById('invite-code').value
            if (!inviteCode) return
            joinNetwork(inviteCode, (err, appName, config) => {
              spinner.style.display = 'none'
              if (err) {
                return showError(err, state)
              }
              config.appName = appName
              state.appsFound.set(true)
              state.wizardActive.set(false)
              state.noApps.set(false)
              startApp(state, config, true)
            })
          }}, wizard.continue)
        ])
      ])
    ]),
    pubWizard: pubWizard(onPubCreated)
  }
  return div('#wizard-view', computed(pageObs, pageName => wizardPages[pageName]))
}

function resetWizardState(state) {
  delete state.wizard.appId
  delete state.wizard.apiKey
  if (state.apps) {
    pageObs.set('createOrJoin')
  } else {
    state.wizardActive = false
  }
}

function onPubCreated(pubInfo) {
  ipcRenderer.send('create-network', pubInfo)
}

module.exports.resetWizardState = resetWizardState
