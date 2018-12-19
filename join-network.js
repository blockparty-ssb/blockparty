'use strict'
const localSetup = require('./set-up-locally')
const blockpartyDir = require('./blockparty-dir')
const createConfig = require('./create-sbot-config')
const startSbot = require('./server')


module.exports = async function (code, cb) {
  // TODO error handling for wrong input
  const port = parseInt(code.match(/:([0-9]+):/)[1])
  const [invite, appId, appName] = code.split('!')
  const opts = createConfig(appName, appId, port, port + 1, appName)
  localSetup.setUpAppDir(appName, blockpartyDir, opts)
  const sbot = startSbot(opts)
  sbot.invite.accept(invite, err => {
    if (err) return cb(err)
    cb(null, 'Yeah, worked!')
  })
  // show feed if code was accepted
}


