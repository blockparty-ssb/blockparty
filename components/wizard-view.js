'use strict'
const h = require('hyperscript')
const { div, button } =
  require('hyperscript-helpers')(h)
const textField = require('./input-field')
const labels = require('./labels').wizard

module.exports = function () {
  return div('#wizard-view',
    div(labels.enterAppId,
      textField({id: '', name: ''}),
      button('Continue')
    ),
  )
}
