'use strict'
const { div, p } = require('../html-helpers')
const mutantKeys = require('mutant/keys')
const map = require('mutant/map')
const mutantValue = require('mutant/value')
const computed = require('mutant/computed')

module.exports = function (state) {
  const colors = ['#F9065F', '#1DA0E1', '#27A83F', '#F9B405']
  let maybeActiveStyle = {}
  if (state.wizardActive()) {
    maybeActiveStyle['background-color'] = '#F9065F'
  }
  const keyObs = mutantKeys(state.apps)
  return div('.blockparties', [
    div('.list-blockparties', [
      map(keyObs, id => {
        const i = keyObs().indexOf(id)
        const displayId = id.slice(0, 2)
        const color = colors[i % colors.length]
        const colorObs = mutantValue(color)
        const borderObs = mutantValue()
        const bgColorObs = mutantValue()

        function setTabBackgroundColor (appName) {
          const isActive = id === appName
          if (isActive) {
            bgColorObs.set(color)
            colorObs.set('#fff')
            borderObs.set(color)
          } else {
            colorObs.set(color)
            bgColorObs.set('unset')
          }
        }
        setTabBackgroundColor(state.activeApp().appName)
        state.activeApp(activeApp => {
          setTabBackgroundColor(activeApp.appName)
        })
        return div('.blockparty', {
          'ev-click': () => {
            const textFieldInput = document.querySelector('.compose-message > p')
            if (textFieldInput) {
              const originAppDraft = textFieldInput.innerHTML
              state.activeApp().draft = originAppDraft
              textFieldInput.innerHTML = ''
            }
            state.activeApp.set(state.apps.get(id))

            const targetAppDraft = state.activeApp().draft
            if (targetAppDraft) {
              const editor = document.getElementsByClassName('.compose-message')[0]
              const content = p(targetAppDraft)
              editor.innerHTML = content
            }
            state.wizardActive.set(false)
          },
          style: {
            color: colorObs,
            ['border-color']: borderObs,
            ['background-color']: bgColorObs
          }
        }, displayId)
      })
    ]),
    div('#add-network', {
      style: {
        ['background-color']: computed([state.wizardActive], wa => {
          if (wa) return '#F9065F'
          return 'unset'
        })
      },
      'ev-click': () => {
        state.wizardActive.set(true)
        state.activeApp.set({})
      }}, '+')
  ])
}
