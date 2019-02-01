'use strict'
const slugify = require('slugify')
const path = require('path')
const crypto = require('crypto')
const ssbKeys = require('ssb-keys')
const client = require('ssb-client')
const localSetup = require('./set-up-locally')
const installOnDigitalOcean = require('./install-on-digital-ocean')
const startSbot = require('./server')
const createConfig = require('./create-sbot-config')

module.exports = async (pubInfo, blockpartyDir, mainWindow, cb) => {
  const {appName, apiToken, region, size } = pubInfo
  const slugifiedId = slugify(appName)
  const shsKey = crypto.randomBytes(32).toString('base64')
  const dirName = shsKey.replace(/\//g, '')
  const port = Math.floor(50000 + 15000 * Math.random())
  const wsPort = port + 1
  const injectedConfig = createConfig(appName, shsKey, port, wsPort, dirName)

  const appDir = localSetup.setUpAppDir(
    dirName,
    blockpartyDir,
    injectedConfig
  )
  const keys = ssbKeys.loadOrCreateSync(path.join(appDir, 'secret'))
  injectedConfig.keys = keys
  injectedConfig.ownId = keys.id

  const ownSbot = startSbot(injectedConfig)

  injectedConfig.manifest = ownSbot.getManifest()
  injectedConfig.remote = ownSbot.getAddress()
  mainWindow.webContents.send('ssb-config', injectedConfig)
  try {
    var {ip, key} = await installOnDigitalOcean({
      apiToken,
      name: slugifiedId,
      region,
      size,
      appId: shsKey,
      port,
      wsPort,
      userKey: keys.id
    })
  } catch (err) {
    return (cb(err))
  }

  const formatted = key.replace('@', '').replace('.ed25519', '')
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
