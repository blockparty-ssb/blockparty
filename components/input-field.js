'use strict'
const h = require('hyperscript')
const { input } = require('hyperscript-helpers')(h)

// there's a bug in choo where on render a text input field's
// value gets deleted. we work around this by telling it to not
// update text input fields
module.exports = (attrs = {}) => {
  const inputField = input(Object.assign(attrs, {type: 'text'}))
  inputField.isSameNode = (target) => {
    return (target && target.nodeName && target.nodeName === 'INPUT')
  }
  return inputField
}
