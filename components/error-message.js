'use strict'

const { div, button, img, h2 } = require('../html-helpers')

module.exports = function (title, text, buttonAction, buttonTitle = 'Close',) {
  return [
    div('#error-message', [
      div('.top', [
        img('.error-icon', {src: 'styles/img/error.png'}),
        h2('.message-title', title)
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
