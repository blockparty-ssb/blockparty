'use strict'
const { div, h1, p, button } = require('../html-helpers')
const labels = require('./labels').welcome

module.exports = (state) => {
  return div('.welcome!', [
    h1(labels.hello),
    p(labels.firstP),
    button('.app-button', {'ev-click': () => {
      state.wizardActive.set(true)
    }}, 'Get started!')
  ])
}
