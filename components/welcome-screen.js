'use strict'
const { body, button } = require('../html-helpers')

module.exports = (state) => {
  return body('welcome!',
    button({'ev-click': () => {
      state.wizardActive = true
    }}, 'create a network!')
  )
}
