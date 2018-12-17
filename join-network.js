'use strict'

module.exports = async function (code) {
  //TODO error handling for wrong input
  const port = code.match(/:([0-9]+):/)[1]
  const [invite, appId, appName] = code.split('!')
  console.log(port)
  console.log(invite)
  console.log(appId)
  console.log(appName)
}
