'use strict'
const scuttleBot = require('scuttlebot')

module.exports = function(ssbConfigs) {
  const createSbot = scuttleBot
    .use(require('scuttlebot/plugins/master'))
    .use(require('scuttlebot/plugins/gossip'))
    .use(require('scuttlebot/plugins/local'))
    .use(require('scuttlebot/plugins/logging'))
    .use(require('ssb-ws'))

  // sbot regal
  const shelf = ssbConfigs.reduce((acc, ssbConfig) => {
    const sbot = createSbot(ssbConfig)
    acc[ssbConfig.appName]=sbot
    return acc
  }, {})
}
