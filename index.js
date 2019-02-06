/* eslint-disable new-cap */
'use strict'

const { ipcRenderer } = require('electron')
const mutantStruct = require('mutant/struct')
const mutantDict = require('mutant/dict')
const Value = require('mutant/value')
const appView = require('./components/app')
const startApp = require('./start-app')
const showError = require('./show-do-error')
const resetWizard = require('./components/plus').resetWizardState

const state = mutantStruct({
  wizard: mutantDict(),
  wizardActive: false,
  activeApp: {},
  noApps: false,
  appsFound: false,
  apps: mutantDict({}),
  error: Value()
})

waitForConfig(state)

function waitForConfig(state) {
  let isFirst = true
  ipcRenderer.on('no-apps-found', () => state.noApps.set(true))
  ipcRenderer.on('apps-found', () => state.appsFound.set(true))

  ipcRenderer.on('ssb-config', (event, config) => {
    startApp(state, config, isFirst)
    isFirst = false
  })
}

ipcRenderer.on('network-created', (_, {appName, pubConnectionConfig}) => {
  const newApp = state.apps.get(appName)
  state.activeApp.set(newApp)
  newApp.pubConfig = pubConnectionConfig
  state.wizardActive.set(false)
  state.appsFound.set(true)
  state.noApps.set(false)
  resetWizard(state)
})

ipcRenderer.on('network-create-error', (_, err) => {
  resetWizard(state)
  showError(err, state)
})

const appMarkup = appView(state)
document.body.appendChild(appMarkup)
