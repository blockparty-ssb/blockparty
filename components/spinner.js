'use strict'
const { div } = require('../html-helpers')

module.exports = div('.spinner', [
  div('.double-bounce1'),
  div('.double-bounce2'),
  div('.double-bounce3')
])
