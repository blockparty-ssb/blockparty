'use strict'

const { div, button } = require('../html-helpers')

module.exports = function (title, text, buttonAction, buttonTitle = 'Close',) {
  return [
    div('#error-message', [
      div('.top', [
        div('.icon'),
        div('.message-title', title)
      ]),
      div('.bottom', [
        text,
        button('.errorMessageAction', {
          'ev-click': buttonAction
        }, buttonTitle)
      ])
    ]),
    div('#overlay')
  ]
}
