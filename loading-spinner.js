'use strict'

const { div } = require('../html-helpers')

module.exports = function () {
  return [
    div('#loading'),
    div('#overlay')
  ]
}
