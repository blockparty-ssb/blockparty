'use strict'
const slugify = require('slugify')
const path = require('path')
const crypto = require('crypto')
const ssbKeys = require('ssb-keys')
const client = require('ssb-client')
const localSetup = require('./set-up-locally')
const installOnDigitalOcean = require('./install-on-digital-ocean')
const startSbot = require('./server')
const injectConfig = require('ssb-config/inject')

module.exports = async (appName, apiToken, blockpartyDir, mainWindow, cb) => {
  const slugifiedId = slugify(appName)
  const shsKey = crypto.randomBytes(32).toString('base64')
  const port = Math.floor(50000 + 15000 * Math.random())
  const wsPort = port + 1
  const networkConfig = {
    appName,
    caps: {
      shs: shsKey
    },
    port: port,
    allowPrivate: true,
    ws: {
      port: wsPort
    },
    connections: {
      incoming: {
        net: [{ port: port, scope: "public", transform: "shs" }]
      }
    },
    path: path.join(blockpartyDir, slugifiedId)
  }

  const injectedConfig = injectConfig(appName, networkConfig)

  const appDir = localSetup.setUpAppDir(
    slugifiedId,
    blockpartyDir,
    injectedConfig
  )
  // also TODO: use same key for all, or not?
  const keys = ssbKeys.loadOrCreateSync(path.join(appDir, 'secret'))
  injectedConfig.keys = keys

  const ownSbot = startSbot(injectedConfig)

  injectedConfig.manifest = ownSbot.getManifest()
  injectedConfig.remote = ownSbot.getAddress()
  mainWindow.webContents.send('ssb-config', injectedConfig)
  // TODO get these dynamically and let user choose
  const {ip, key} = await installOnDigitalOcean({
    apiToken,
    name: slugifiedId,
    region: 'nyc3',
    size: 's-1vcpu-1gb',
    appId: shsKey,
    port,
    wsPort,
    userKey: keys.id
  })

  const formatted = key.replace('@', '').replace('.ed25519', '')
  const pubAddress = `net:${ip}:${port}~shs:${formatted}`
  const pubConnectionConfig = Object.assign(injectedConfig, {
    remote: pubAddress,
    manifest: {manifest: 'sync'}
  })
  client(keys, pubConnectionConfig, (err, ssb) => {
    if (err) return console.log(err)
    ssb.manifest((err, manifest) => {
      if (err) return console.log(err)
      pubConnectionConfig.manifest = manifest
      localSetup.persistPubConfig(pubConnectionConfig, appDir)
      client(keys, pubConnectionConfig, (err, pubSbot) => {
        if (err) return console.log(err)
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
