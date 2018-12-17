// taken from ssb-client/inject, because we don't want to use RC
'use strict'

var nonPrivate = require('non-private-ip')
var merge = require('deep-extend')

var SEC = 1e3
var MIN = 60*SEC

module.exports = function (src) {
  var port = src && src.port || 8008
  return merge({
    party: true,
    host: nonPrivate.v4 || '',
    port: port,
    timeout: 0,
    pub: true,
    local: true,
    friends: {
      dunbar: 150,
      hops: 3
    },
    ws: {
      port: 8989
    },
    gossip: {
      connections: 3
    },
    connections: {
      incoming: {
        net: [{ port: port, scope: "public", transform: "shs" }]
      },
      outgoing: {
        net: [{ transform: "shs" }]
      }
    },
    timers: {
      connection: 0,
      reconnect: 5*SEC,
      ping: 5*MIN,
      handshake: 5*SEC
    },
    // change these to make a test network that will not connect to the main network.
    caps: {
      shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=',
      // used to sign messages
      sign: null
    },
    master: [],
    logging: { level: 'notice' }
  }, src || {})
}


