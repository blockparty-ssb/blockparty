'use strict'
const { ipcRenderer, shell } = require('electron')
const mutantValue = require('mutant/value')
const computed = require('mutant/computed')
const { div, button, p, h2, h3, section, select, input, option } =
  require('../html-helpers')
const {wizard} = require('./labels')
const joinNetwork = require('../join-network')
const startApp = require('../start-app')
const getSizes = require('../get-sizes')
const showError = require('../show-do-error')

module.exports = function (state) {
  const appIdObs = mutantValue()
  const apiKeyObs = mutantValue()
  const doSizesObs = mutantValue()
  const doRegionsObs = mutantValue()
  const sizeObs = mutantValue()
  const regionObs = mutantValue()
  const wizardPages = {
    enterName: section('.wizard-page', [
      div('.wrapper', [
        h2('Create a new community or join an existing one!'),
        div('.box', [
          h3(wizard.enterAppId),
          input('#wizard-app-id', {attributes: {required: true}}),
          button('.button-continue .app-button', {'ev-click': () => {
            const wizardInput = document.getElementById('wizard-app-id').value
            if (!wizardInput) {
              return
            }
            appIdObs.set(wizardInput)
            pageObs.set(wizardPages.hasAccount)
          }}, wizard.continue)
        ]),
        div('.box', [
          h3(wizard.enterInvite),
          input('#invite-code'),
          button('.button-continue .app-button', {'ev-click': () => {
            const inviteCode = document.getElementById('invite-code').value
            if (!inviteCode) return
            joinNetwork(inviteCode, (err, appName, config) => {
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
    hasAccount: section('.wizard-page', [
      div('.wrapper', [
        h2(wizard.haveAccount),
        div('.box', [
          h3(wizard.accountNo),
          p(wizard.getDOAccount),
          button('#make-account .app-button', {'ev-click': () => shell.openExternal(wizard.dOURL)}, wizard.goToDO)
        ]),
        div('.box', [
          h3(wizard.accountYes),
          p(wizard.giveApiKey),
          input({id: 'wizard-api-key'}),
          makeCancelButton(),
          button('.button-continue .app-button', {'ev-click': async () => {
            const apiKeyValue = document.getElementById('wizard-api-key').value
            apiKeyObs.set(apiKeyValue)
            pageObs.set(wizardPages.sizeAndRegion)
            try {
              var sizes = await getSizes(apiKeyValue)
            } catch (err) {
              return showError(err, state)
            }
            doSizesObs.set(sizes)
          }}, wizard.continue)
        ])
      ])
    ]),
    sizeAndRegion: section('.wizard-page', [
      div('.wrapper', [
        h2(wizard.chooseOptions),
        div('.box', [
          select(
            {'ev-change': ev => {
              const chosenSize = ev.target.value
              if (!chosenSize) {
                doRegionsObs.set(null)
                return
              }
              const matchSize = doSizesObs().find(item => item.slug === chosenSize)
              doRegionsObs.set(matchSize.regions)
              sizeObs.set(chosenSize)
            }},
            computed([doSizesObs], sizes => {
              if (!sizes) return
              return sizes.reduce((selectOptions, size) => {
                selectOptions.push(option({value: size.slug}, size.slug))
                return selectOptions
              }, [option({value: ""}, "Please choose")])
            })
          ),
          select(
            {'ev-change': ev => regionObs.set(ev.target.value)},
            computed([doRegionsObs], regions => regions && regions.map(region => option(region)))
          ),
          makeCancelButton(),
          button('.button-continue .app-button', {'ev-click': () => {
            pageObs.set(wizardPages.confirmation)
          }}, wizard.yesCreate)
        ])
      ])
    ]),
    confirmation: section('.wizard-page', [
      div('.wrapper', [
        h2(wizard.confirmation),
        div('.box', [
          p(appIdObs),
          p(apiKeyObs),
          p(sizeObs),
          p(regionObs),
          makeCancelButton(),
          button('.button-continue .app-button', {'ev-click': () => {
            ipcRenderer.send('create-network', {
              appName: appIdObs(),
              apiToken: apiKeyObs(),
              size: sizeObs(),
              region: regionObs()
            })
            pageObs.set(wizardPages.wait)
          }}, wizard.yesCreate)
        ])
      ])
    ]),
    wait: section('.wizard-page', [
      div('.wrapper', [
        h2(wizard.paintWhileWaiting),
        p(wizard.takeSomeTime)
      ])
    ])
  }
  const pageObs = mutantValue(wizardPages.enterName)

  function makeCancelButton() {
    return button('.button-cancel .app-button', {'ev-click': () => {
      delete state.wizard.appId
      delete state.wizard.apiKey
      if (state.apps) {
        pageObs.set(wizardPages.enterName)
      } else {
        state.wizardActive = false
      }
    }}, wizard.cancel)
  }

  return div('#wizard-view', pageObs)
}
