'use strict'
const h = require('hyperscript')
const { div } = require('hyperscript-helpers')(h)

module.exports = function (state, emit) {
  const appIds = Object.keys(state.apps)
  const colors = ['#F9065F', '#1DA0E1', '#27A83F', '#F9B405']
  return div('.blockparties',
    div('.list-blockparties',
      appIds.map((id, i) => {
        const displayId = id.slice(0, 2)
        return div('.blockparty', displayId, {
          onclick: () => {
            state.activeApp = id
            state.wizardActive = false
            emit('render')
          },
          style: {
            'background-color': colors[i % colors.length]
          }
        })
      })
    ),
    div('#add-network', '+', {onclick: () => {
      state.wizardActive = true
      emit('render')
    }}),
  )
}
