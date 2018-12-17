'use strict'

module.exports = async function redeemInviteCode(code) {
  //TODO error handling for wrong input
  const port = code.match(/:([0-9]+):/)[1]
  const [invite, appId] = code.split('!')
  console.log(port)
  console.log(invite)
  console.log(appId)
}
