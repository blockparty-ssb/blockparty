'use strict'
const { div, body} = require('../html-helpers')
const computed = require('mutant/computed')
const when = require('mutant/when')
const loadingScreen = require('./loading-screen')
const welcomeScreen = require('./welcome-screen')
const makeSidebar = require('./sidebar')
const makeAppView = require('./main-view')
const makeWizardView = require('./wizard-view')

module.exports = (state) => {
  const noAppsAndWizardActive = computed([state.noApps, state.wizardActive], (a,b) => a && b)
  const noAppsAndWizardInactive = computed([state.noApps, state.wizardActive], (a,b) => a && !b)
  const lookingForApps = computed([state.noApps, state.appsFound], (a, b) => !a && !b)

  return div(
    computed([
      noAppsAndWizardActive,
      noAppsAndWizardInactive,
      lookingForApps,
      state.appsFound
    ], (nwa, nwi, lfa, af) => {
      if (nwa) return body(makeWizardView)
      if (nwi) return welcomeScreen(state)
      if (lfa) return loadingScreen()
      if (af) return body(
        div('.SplitWindow', [
          makeSidebar(state),
          when(state.wizardActive,
            makeWizardView(state),
            makeAppView(state)
          )
        ])
      )
    })
  )
}
