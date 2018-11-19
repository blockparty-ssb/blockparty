'use strict'
const h = require('hyperscript')
const { div, body } =
  require('hyperscript-helpers')(h)
const onLoad = require('on-load')
const loadingScreen = require('./loading-screen')
const welcomeScreen = require('./welcome-screen')
const makeSidebar = require('./sidebar')
const makeAppView = require('./main-view')
const makeWizardView = require('./wizard-view')

module.exports = (state, emit) => {
  if (state.noApps && state.wizardActive) return body(makeWizardView(state, emit))
  if (state.noApps) return welcomeScreen(state, emit)
  if (!state.apps) return loadingScreen()
  const appIds = Object.keys(state.apps)
  const colors = ['lightyellow', 'lightblue']
  const appIndex = appIds.indexOf(state.activeApp)
  const bg = `background-color:${colors[appIndex]}`
  const appMarkup = body({style: bg},
    div('.SplitView',
      makeSidebar(state, emit),
      state.wizardActive ?
        makeWizardView(state, emit) :
        makeAppView(state, emit)
    )
  )
  onLoad(appMarkup, () => setupDOMListeners(state, emit, appIds))
  return appMarkup
}

function setupDOMListeners(state) {
  document.getElementById('publish').addEventListener('click', () => {
    getActiveApp().server.publish({
      type: 'hello-world'
    }, err => console.log(err))
  })

  document.getElementById('add-to-list').addEventListener('click', () => {
    const textField = document.getElementById('post')
    getActiveApp().server.publish({
      type: 'post',
      text: textField.value
    }, err => console.log(err))
    textField.value = ''
  })

  document.getElementById('add-username').addEventListener('click', () => {
    const textField = document.getElementById('username')
    getActiveApp().server.publish({
      type: 'about',
      name: textField.value,
      about: getActiveApp().ownId
    }, err => console.log(err))
    textField.value = ''
  })

  function getActiveApp() {
    return state.apps[state.activeApp]
  }
}
