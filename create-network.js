'use strict'
const client = require('ssb-client')
const localSetup = require('./set-up-locally')
const startSbot = require('./server')
const createConfig = require('./create-sbot-config')

module.exports = async (pubInfo, blockpartyDir, mainWindow, cb) => {
  const {appName, port, wsPort, keys, pubKey, ip } = pubInfo
  const shsKey = pubInfo.appId
  const dirName = shsKey.replace(/\//g, '')
  const injectedConfig = createConfig(appName, shsKey, port, wsPort, dirName)

  const appDir = localSetup.setUpAppDir(
    dirName,
    blockpartyDir,
    injectedConfig
  )
  injectedConfig.keys = keys
  injectedConfig.ownId = keys.id

  const ownSbot = startSbot(injectedConfig)

  injectedConfig.manifest = ownSbot.getManifest()
  injectedConfig.remote = ownSbot.getAddress()
  mainWindow.webContents.send('ssb-config', injectedConfig)

  const formatted = pubKey.replace('@', '').replace('.ed25519', '')
  const pubAddress = `net:${ip}:${port}~shs:${formatted}`
  const pubConnectionConfig = Object.assign(injectedConfig, {
    remote: pubAddress,
    manifest: {manifest: 'sync'}
  })
  client(keys, pubConnectionConfig, (err, ssb) => {
    // TODO Handle error
    if (err) return console.log(err)
    ssb.manifest((err, manifest) => {
      // TODO Handle error
      if (err) return console.log(err)
      pubConnectionConfig.manifest = manifest
      localSetup.persistPubConfig(pubConnectionConfig, appDir)
      client(keys, pubConnectionConfig, (err, pubSbot) => {
        if (err) return console.log(err)
        // TODO Handle error
        pubSbot.invite.create(1, (err, code) => {
          if (err) return cb(err)
          ownSbot.invite.accept(code, err => {
            if (err) return cb(err)
            cb(null, pubConnectionConfig)
          })
        })
      })
    })
  })
}
