'use strict'

const { ipcRenderer } = require('electron')
const connection = require('ssb-client')
const pull = require('pull-stream')
const choo = require('choo')
const appView = require('./components/app')

// choo app
const app = choo()
app.use(waitForConfig)
app.route('/', appView)
app.mount('body')

function waitForConfig(state, emitter) {
  ipcRenderer.on('ssb-configs', (event, configs) => {
    const appIds = configs.map(c => c.appName)
    prepareState(state, emitter, appIds)
    configs.forEach(config => {
      connection(config.keys, config, (err, server) => {
        const app = state.apps[config.appName]
        if (err) return console.log(err)
        app.server = server
        setInterval(function () {
          server.gossip.peers((err, peers) => {
            if (err) {
              console.log(err)
              return
            }
            app.peers = peers
            // emitter.emit('render')
          })
        }, 8000) // peers as live-stream

        // TODO don't do this twice
        emitter.emit('render')

        // collect posts
        pull(
          server.query.read({
            live: true,
            query: [{$filter: {
              value: { content: { type: 'post' }}
            }}]
          }),
          pull.drain(msg => {
            if (!msg.value) return
            app.messages.unshift(msg)
            emitter.emit('render')
          })
        )
        // collect own username(s)
        pull(
          server.query.read({
            live: true,
            query: [{$filter: {
              value: {
                author: config.keys.id,
                content: { type: 'about' }
              }
            }}]
          }),
          pull.drain(msg => {
            if (!msg.value) return
            app.userNames.unshift(msg.value.content.name)
            emitter.emit('render')
          })
        )
      })
    })
  })
}

function prepareState(state, emitter, appIds) {
  state.activeApp = appIds[0]
  state.apps = appIds.reduce((apps, id) => {
    apps[id] = {
      messages: [],
      peers: [],
      userNames: []
    }
    return apps
  }, {})
}
