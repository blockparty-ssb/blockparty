'use strict'
const slugify = require('slugify')
const path = require('path')
const crypto = require('crypto')
const ssbKeys = require('ssb-keys')
const client = require('ssb-client')
const setUpNetworkLocally = require('./set-up-locally')
const installOnDigitalOcean = require('./install-on-digital-ocean')
const startSbot = require('./server')
const injectConfig = require('ssb-config/inject')

module.exports = async (appName, apiToken, blockpartyDir, mainWindow) => {
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

  const appDir = setUpNetworkLocally(
    slugifiedId,
    blockpartyDir,
    injectedConfig
  )
  // also TODO: use same key for all, or not?
  const keys = ssbKeys.loadOrCreateSync(path.join(appDir, 'secret'))
  injectedConfig.keys = keys

  const newSbot = startSbot(injectedConfig)

  injectedConfig.manifest = newSbot.getManifest()
  injectedConfig.remote = newSbot.getAddress()
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

  // TODO have sbot-whoareyou return the whole address so we don't have to fiddle
  // with the formatting
  const formatted = key.replace('@', '').replace('.ed25519', '')
  const pubConnectionConfig = Object.assign(injectedConfig, {
    remote: `net:${ip}:${port}~shs:${formatted}`
  })

  client(keys, injectConfig(appName, pubConnectionConfig), (err, pubSbot) => {
    if (err) return console.log(err)

    pubSbot.publish({
      type: 'contact',
      contact: keys.id,
      following: true
    }, (err, msg) => {
      if (err) {
        return console.log(err)
      } else {
        console.log('juhuuuu', msg)
      }
    })
  })
}
