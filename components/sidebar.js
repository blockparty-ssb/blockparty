'use strict'
const h = require('hyperscript')
const { div } = require('hyperscript-helpers')(h)

module.exports = function (state, emit) {
  const appIds = Object.keys(state.apps)
  const colors = ['#F9065F', '#1DA0E1', '#27A83F', '#F9B405']
  return div('.blockparties',
    div('.list-blockparties',
      appIds.map((id, i) => {
        var isActive = id === state.activeApp
        const displayId = id.slice(0, 2)
        const currentStyle = {}
        const color = colors[i % colors.length]
        if (isActive) {
          currentStyle['background-color']= color
          currentStyle.color = '#fff'
          currentStyle.border = '1px solid' + color
        } else {
          currentStyle.color = color
        }
        return div('.blockparty', displayId, {
          onclick: () => {
            state.activeApp = id
            state.wizardActive = false
            emit('render')
          },
          style: currentStyle
        }
        )
      })
    ),
    div('#add-network', '+', {onclick: () => {
      state.wizardActive = true
      emit('render')
    }}),
  )
}
