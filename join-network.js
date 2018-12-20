'use strict'
const path = require('path')
const ssbKeys = require('ssb-keys')
const localSetup = require('./set-up-locally')
const blockpartyDir = require('./blockparty-dir')
const createConfig = require('./create-sbot-config')
const startSbot = require('./server')

module.exports = async function (code, cb) {
  // TODO error handling for wrong input
  const port = parseInt(code.match(/:([0-9]+):/)[1])
  const [invite, appId, inviterId, appName] = code.split('!')
  const opts = createConfig(appName, appId, port, port + 1, appName)
  const appDir = localSetup.setUpAppDir(appName, blockpartyDir, opts)
  ssbKeys.loadOrCreateSync(path.join(appDir, 'secret'))
  const sbot = startSbot(opts)
  sbot.invite.accept(invite, err => {
    if (err) return cb(err)
    sbot.publish({
      type: "contact",
      contact: inviterId,
      following: true
    }, err => {
      if (err) return cb(err)
      cb(null, 'Jipiieeh')
    })
  })
  // TODO show feed if code was accepted
}


