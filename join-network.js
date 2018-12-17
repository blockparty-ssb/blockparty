'use strict'
const localSetup = require('./set-up-locally')
const blockpartyDir = require('./blockparty-dir')
const createConfig = require('./create-sbot-config')
const startSbot = require('./server')


module.exports = async function (code) {
  // TODO error handling for wrong input
  const port = parseInt(code.match(/:([0-9]+):/)[1])
  const [invite, appId, appName] = code.split('!')
  console.log(port)
  console.log(invite)
  console.log(appId)
  console.log(appName)
  const opts = createConfig(appName, appId, port, port + 1, appName)
  localSetup.setUpAppDir(appName, blockpartyDir, opts)
  // start sbot
  startSbot(opts)
  // use sbot to accept or decline invite code
  // show feed if code was accepted
}
