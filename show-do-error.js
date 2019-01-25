'use strict'

const makeErrorMessage = require('./components/error-message')
const {errors} = require('./labels')

module.exports = function (err, state) {
  const errorTexts = {
    ipTimeout: errors.ipTimeout,
    pubInfoTimeout: errors.pubInfoTimeout,
    wrongToken: errors.wrongToken,
    noInternet: errors.noInternet,
    badInviteCode: errors.badInviteCode
  }
  let error = errorTexts[err.message]
  if (!error) {
    error = {
      title: 'Oops, something went wrong',
      text: err.message
    }
  }
  state.error.set(makeErrorMessage(
    error.title,
    error.text,
    () => state.error.set(null)
  ))
}
