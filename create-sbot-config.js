'use strict'
const path = require('path')
const blockpartyDir = require('./blockparty-dir')
const injectConfig = require('./inject')

module.exports = function(appName, shsKey, port, wsPort, slugifiedId) {
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

  return injectConfig(networkConfig)
}
