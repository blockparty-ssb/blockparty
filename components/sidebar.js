'use strict'
const { div } = require('../html-helpers')

module.exports = function (state) {
  const appIds = Object.keys(state.apps)
  const colors = ['#F9065F', '#1DA0E1', '#27A83F', '#F9B405']
  let maybeActiveStyle = {}
  if (state.wizardActive) {
    maybeActiveStyle['background-color'] = '#F9065F'
  }
  return div('.blockparties', [
    div('.list-blockparties',
      appIds.map((id, i) => {
        var isActive = id === state.activeApp
        const displayId = id.slice(0, 2)
        const currentStyle = {}
        const color = colors[i % colors.length]
        if (isActive && !state.wizardActive) {
          currentStyle['background-color']= color
          currentStyle.color = '#fff'
          currentStyle.border = '1px solid' + color
        } else {
          currentStyle.color = color
        }
        return div('.blockparty', {
          'ev-click': () => {
            state.activeApp = id
            state.wizardActive = false
          },
          style: currentStyle
        }, displayId)
      })
    ),
    div('#add-network', {
      style: maybeActiveStyle,
      'ev-click': () => {
        state.wizardActive = true
      }}, '+')
  ])
}
