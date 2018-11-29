'use strict'
const { div } = require('../html-helpers')
const mutantKeys = require('mutant/keys')
const map = require('mutant/map')
const mutantValue = require('mutant/value')
const watch = require('mutant/watch')

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
        watch(state.activeApp, activeApp => {
          const isActive = id === activeApp
          if (isActive && !state.wizardActive()) {
            bgColorObs.set(color)
            colorObs.set('#fff')
            borderObs.set(color)
          } else {
            colorObs.set(color)
            bgColorObs.set('unset')
          }
        })
        return div('.blockparty', {
          'ev-click': () => {
            state.activeApp.set(id)
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
      style: maybeActiveStyle,
      'ev-click': () => {
        state.wizardActive.set(true)
      }}, '+')
  ])
}
