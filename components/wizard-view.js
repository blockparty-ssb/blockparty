'use strict'
const h = require('hyperscript')
const { div, ul, li, button, h4 } =
  require('hyperscript-helpers')(h)
const textField = require('./input-field')

module.exports = function () {
  return div('#wizard-view',
    'helloooooo i am a wizard'
  )
}
