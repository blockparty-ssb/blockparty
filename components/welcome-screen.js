'use strict'
const { div, section, h1, h2, p, button, input } = require('../html-helpers')
const labels = require('./labels').welcome
const joinNetwork = require('../join-network')

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
      input('#invite-code'),
      button('.button-continue', {'ev-click': async () => {
        // TODO deduplicate with wizard view
        const inviteCode = document.getElementById('invite-code').value
        if (!inviteCode) return
        // TODO error handling
        await joinNetwork(inviteCode, err => {
          if (err) console.log(err)
        })
      }}, labels.continue)
    ])
  ]
  )
}
