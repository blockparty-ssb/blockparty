'use strict'
const h = require('hyperscript')
const { div } = require('hyperscript-helpers')(h)

module.exports = function (state, emit) {
  const appIds = Object.keys(state.apps)
  return div('.blockparties',
    div('.list-blockparties',
      appIds.map(id => {
        const displayId = id.slice(0, 2)
        return div('.blockparty', displayId, {
          onclick: () => {
            state.activeApp = id
            state.wizardActive = false
            emit('render')
          },
          style: {
            'background-color': state.apps[id].tabColor
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
