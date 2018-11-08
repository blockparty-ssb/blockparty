'use strict'
const h = require('hyperscript')
const { body, button } = require('hyperscript-helpers')(h)

module.exports = (state, emit) => {
  return body('welcome!',
    button('create a network!', {onclick: () => {
      state.wizardActive = true
      emit('render')
    }})
  )
}
