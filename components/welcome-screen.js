'use strict'
const { body, button } = require('../html-helpers')

module.exports = (state) => {
  return body('welcome!',
    button({'ev-click': () => {
      state.wizardActive.set(true)
    }}, 'create a network!')
  )
}
