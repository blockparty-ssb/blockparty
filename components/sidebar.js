'use strict'
const { div } = require('../html-helpers')
const mutantKeys = require('mutant/keys')
const map = require('mutant/map')
const computed = require('mutant/computed')

module.exports = function (state) {
  console.log('runs')
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
        const currentStyleObs = computed([state.activeApp], activeApp => {
          var isActive = id === activeApp
          const currentStyle = {}
          const color = colors[i % colors.length]
          if (isActive && !state.wizardActive()) {
            currentStyle['background-color']= color
            currentStyle.color = '#fff'
            currentStyle.border = '1px solid' + color
          } else {
            currentStyle.color = color
          }
          return currentStyle
        })
        return div('.blockparty', {
          'ev-click': () => {
            state.activeApp.set(id)
            state.wizardActive.set(false)
          },
          style: currentStyleObs
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
