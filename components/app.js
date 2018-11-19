'use strict'
const h = require('hyperscript')
const { div, body } =
  require('hyperscript-helpers')(h)
const loadingScreen = require('./loading-screen')
const welcomeScreen = require('./welcome-screen')
const makeSidebar = require('./sidebar')
const makeAppView = require('./main-view')
const makeWizardView = require('./wizard-view')

module.exports = (state, emit) => {
  if (state.noApps && state.wizardActive) return body(makeWizardView(state, emit))
  if (state.noApps) return welcomeScreen(state, emit)
  if (!state.apps) return loadingScreen()
  const appMarkup = body(
    div('.SplitView',
      makeSidebar(state, emit),
      state.wizardActive ?
        makeWizardView(state, emit) :
        makeAppView(state, emit)
    )
  )
  return appMarkup
}
