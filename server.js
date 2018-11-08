'use strict'
const scuttleBot = require('scuttlebot')

module.exports = function(ssbConfigs) {
  const createSbot = scuttleBot
    .use(require('scuttlebot/plugins/master'))
    .use(require('scuttlebot/plugins/gossip'))
    .use(require('scuttlebot/plugins/local'))
    .use(require('scuttlebot/plugins/logging'))
    .use(require('scuttlebot/plugins/replicate'))
    .use(require('ssb-query'))
    .use(require('ssb-ws'))
    .use(require('ssb-friends'))

  return ssbConfigs.reduce((acc, ssbConfig) => {
    const sbot = createSbot(Object.assign(ssbConfig, {
      logging: {
        level: 'info'
      }
    }))
    acc[ssbConfig.appName]=sbot
    return acc
  }, {})
}
