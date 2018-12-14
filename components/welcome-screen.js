'use strict'
const { div, section, h1, h2, p, button } = require('../html-helpers')
const labels = require('./labels').welcome

module.exports = (state) => {
  return div('.welcome!', [
    h1(labels.hello),
    p(labels.firstP),
    section('.option1', [
      h2(labels.setupBlockparty),
      p(labels.readManual),
      button({'ev-click': () => {
        state.wizardActive.set(true)
      }}, 'Create my new community!')
    ]),
    section('.option2', [
      h2(labels.join),
      p(labels.joinCommunity),
      button({'ev-click': () => {
      }}, 'Join an existing blockparty')
    ])
  ]
  )
}
