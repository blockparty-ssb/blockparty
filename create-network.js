'use strict'
const slugify = require('slugify')
const path = require('path')
const crypto = require('crypto')
const ssbKeys = require('ssb-keys')
const setUpNetworkLocally = require('./set-up-locally')
const installOnDigitalOcean = require('./install-on-digital-ocean')
const startSbot = require('./server')

module.exports = async (appName, apiToken, blockpartyDir) => {
  const slugifiedId = slugify(appName)
  const shsKey = crypto.randomBytes(32).toString('base64')
  const port = Math.floor(50000 + 15000 * Math.random())
  const wsPort = port + 1
  const networkConfig = {
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
    }
  }

  const appDir = setUpNetworkLocally(
    slugifiedId,
    blockpartyDir,
    networkConfig
  )
  // also TODO: use same key for all, or not?
  const keys = ssbKeys.loadOrCreateSync(path.join(appDir, 'secret'))

  const newSbot = startSbot(networkConfig)
  networkConfig.manifest = newSbot.getManifest()
  // TODO send network config to client

  // TODO get these dynamically and let user choose
  const remoteIp = await installOnDigitalOcean({
    apiToken,
    name: slugifiedId,
    region: 'nyc3',
    size: 's-1vcpu-1gb',
    appId: shsKey,
    port,
    wsPort,
    userKey: keys.id
  })

  console.log(remoteIp)
}
