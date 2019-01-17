'use strict'
const path = require('path')
const ssbKeys = require('ssb-keys')
const localSetup = require('./set-up-locally')
const blockpartyDir = require('./blockparty-dir')
const createConfig = require('./create-sbot-config')
const startSbot = require('./server')

module.exports = async function (code, cb) {
  const regExPort = code.match(/:([0-9]+):/)
  if (!regExPort) {
    return cb(new Error('bad invite code'))
  }
  const cleanRegEx = regExPort[1]
  const port = parseInt(cleanRegEx)
  const inviteCodeParts = code.split('!')
  if (inviteCodeParts.length !== 4) {
    return cb(new Error('bad invite code'))
  }
  const [invite, appId, inviterId, appName] = inviteCodeParts
  const config = createConfig(appName, appId, port, port + 1, appName)
  // TODO we shouldn't write the directory before we know whether the invite
  // was successful? Or delete in error case?
  const appDir = localSetup.setUpAppDir(appName, blockpartyDir, config)
  const keys = ssbKeys.loadOrCreateSync(path.join(appDir, 'secret'))
  config.keys = keys
  const sbot = startSbot(config)
  config.manifest = sbot.getManifest()
  config.ownId = keys.id
  sbot.invite.accept(invite, err => {
    if (err) return cb(err)
    sbot.publish({
      type: "contact",
      contact: inviterId,
      following: true
    }, err => {
      if (err) return cb(err)
      cb(null, appName, config)
    })
  })
}


