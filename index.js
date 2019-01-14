'use strict'

const { ipcRenderer } = require('electron')
const mutantStruct = require('mutant/struct')
const mutantDict = require('mutant/dict')
const appView = require('./components/app')
const startApp = require('./start-app')

const state = mutantStruct({
  wizard: mutantDict(),
  wizardActive: false,
  activeApp: {},
  noApps: false,
  appsFound: false,
  apps: mutantDict({})
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

ipcRenderer.on('network-created', (event, {appName, pubConnectionConfig}) => {
  const newApp = state.apps.get(appName)
  state.activeApp.set(newApp)
  newApp.pubConfig = pubConnectionConfig
  state.wizardActive.set(false)
  state.appsFound.set(true)
  state.noApps.set(false)
})

const appMarkup = appView(state)
document.body.appendChild(appMarkup)
