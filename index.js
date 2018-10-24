'use strict'

const { ipcRenderer } = require('electron')
const connection = require('ssb-client')
const pull = require('pull-stream')
const choo = require('choo')
const appView = require('./components/app')
const loadingScreen = require('./components/loading-screen')
// choo app

const app = choo()
app.use(waitForConfig)
app.route('/', loadingScreen)
app.route('/app', appView)
app.mount('body')

function waitForConfig(state, emitter) {
  window.onerror = function() {}
  ipcRenderer.on('ssb-configs', (event, configs) => {
    const appIds = configs.map(c => c.appName)
    prepareState(state, emitter, appIds)
    configs.forEach(config => {
      connection(config.keys, config, (err, server) => {
        if (err) return console.log(err)
        state.servers[config.appName] = server
        setInterval(function () {
          server.gossip.peers((err, peers) => {
            if (err) {
              console.log(err)
              return
            }
            state.peers[config.appName] = peers
            emitter.emit('render')
          })
        }, 8000) // peers as live-stream

        pull(
          server.createFeedStream({live: true}),
          pull.drain(msg => {
            if (!msg.value) return
            state.messages[config.appName] = state.messages[config.appName] || []
            state.messages[config.appName].unshift(msg)
            emitter.emit('replaceState', '/app')
          })
        )
      })
    })
  })
}

function prepareState(state, emitter, appIds) {
  state.activeApp = appIds[0]
  state.servers = {}
  state.messages = {}
  state.peers = {}
  appIds.reduce((acc, curr) => {
    acc[curr] = []
    return acc
  }, state.messages)
  appIds.reduce((acc, curr) => {
    acc[curr] = []
    return acc
  }, state.peers)
}
