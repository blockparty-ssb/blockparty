'use strict'

const { ipcRenderer } = require('electron')
const connection = require('ssb-client')
const choo = require('choo')
const pull = require('pull-stream')
const appView = require('./components/app')

// choo app
const app = choo()
app.use(waitForConfig)
app.use(setUpMessageStream)
app.use(getUserNames)
app.route('/', appView)
app.mount('body')

window.onerror = function() {}

function waitForConfig(state, emitter) {
  ipcRenderer.on('ssb-configs', (event, configs) => {
    const appIds = configs.map(c => c.appName)
    prepareState(state, appIds)
    configs.forEach(config => {
      connection(config.keys, config, (err, server) => {
        const app = state.apps[config.appName]
        if (err) return console.log(err)
        app.server = server
        app.ownId = config.keys.id
        setInterval(function () {
          // TODO find out how to filter for local peers
          server.gossip.peers((err, peers) => {
            if (err) {
              console.log(err)
              return
            }
            app.peers = peers
            emitter.emit('render')
          })
        }, 8000) // peers as live-stream

        // TODO later this needs to become an async-map or similar
        if (Object.keys(state.apps).every(app => state.apps[app].server)) {
          console.log('all good to go, firing')
          emitter.emit('set-up-message-stream')
          emitter.emit('get-user-names')
          emitter.emit('render')
        }
      })
    })
  })
}

function prepareState(state, appIds) {
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

function setUpMessageStream(state, emitter) {
  emitter.on('set-up-message-stream', () => {
    console.log('setting up mesage stream')
    pull(
      state.apps[state.activeApp].server.query.read({
        reverse: true,
        query: [{$filter: {
          value: { content: { type: 'post' }}
        }}]
      }),
      read => {
        getOneMessage(state.apps[state.activeApp].messages)
        emitter.on('get-messages', () => {
          getOneMessage(state.apps[state.activeApp].messages)
        })

        function getOneMessage(messages) {
          read(null, function next(end, msg) {
            if (end === true) return console.log('end')
            if (end) throw end
            if (!msg.value) return
            messages.push(msg)
            emitter.emit('render')
          })
        }
      }
    )
  })
}

function getUserNames(state, emitter) {
  emitter.on('get-user-names', () => {
    const app = state.apps[state.activeApp]
    pull(
      app.server.query.read({
        live: true,
        query: [{$filter: {
          value: {
            author: app.ownId,
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
}
