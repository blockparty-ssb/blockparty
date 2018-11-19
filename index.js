'use strict'

const { ipcRenderer } = require('electron')
const connection = require('ssb-client')
const choo = require('choo')
const pull = require('pull-stream')
const paraMap = require('pull-paramap')
const appView = require('./components/app')

const batchSize = 100

// choo app
const app = choo()
app.use(waitForConfig)
app.route('/', appView)
app.mount('body')

window.onerror = function() {}

function waitForConfig(state, emitter) {
  // TODO move state.wizard?
  state.wizard = {}

  ipcRenderer.on('no-apps-found', () => {
    state.noApps = true
    emitter.emit('render')
  })

  ipcRenderer.on('initial-active', (event, appName) => {
    state.activeApp = appName
  })

  ipcRenderer.on('ssb-config', (event, config) => {
    addAppToState(state, config.appName)
    connection(config.keys, config, (err, server) => {
      if (err) return console.log(err)
      const app = state.apps[config.appName]
      app.server = server
      app.ownId = config.keys.id
      setInterval(function () {
        // TODO find out how to filter for local peers only
        server.gossip.peers((err, peers) => {
          if (err) {
            console.log(err)
            return
          }
          let peersWithDisplayName = 0
          app.peers = peers
          peers.forEach(peer => {
            getDisplayNameForUserId(peer.key, server, (err, name) => {
              peer.displayName = name
              peersWithDisplayName++
              if (peersWithDisplayName === peers.length ) {
                emitter.emit('render')
              }
            })
          })
        })
      }, 5000)
      setUpMessageStream(state, emitter, config.appName)
      getUserNames(state, emitter, config.appName)
      emitter.emit('render')
    })
  })
}

function addAppToState(state, appId) {
  state.apps = state.apps || {}
  state.apps[appId] = {
    messages: [],
    peers: [],
    userNames: []
  }
}

function setUpMessageStream(state, emitter, appName) {
  const getResultFromDatabase = state.apps[appName].server.query.read
  pull(
    getResultFromDatabase({
      live: true,
      query: [{$filter: {
        value: { content: { type: 'post' }}
      }}]
    }),
    paraMap((msg, cb) => {
      if (!msg.value) {
        cb(null, msg)
        return
      }
      const userId = msg.value.author
      pull(
        getResultFromDatabase({
          reverse: true,
          limit: 1,
          query: [
            {
              $filter: {
                value: {
                  author: userId,
                  content: {
                    type: 'about',
                    about: userId,
                    name: {$is: 'string'}
                  }
                },
                timestamp: { $gt: 0}
              }
            },
            {
              $map: {
                name: ['value', 'content', 'name']
              }
            }
          ]
        }),
        pull.drain(name => {
          msg.value.displayName = name.name
          cb(null, msg)
        })
      )
    }, batchSize),
    read => {
      getBatchOfMessages(state.apps[appName].messages)
      emitter.on('get-messages', targetApp => {
        if (targetApp === appName) {
          getBatchOfMessages(state.apps[appName].messages)
        }
      })

      function getBatchOfMessages(messages) {
        // TODO actually use batching again
        let i = 0
        read(null, function next(end, msg) {
          if (end === true) return emitter.emit('render')
          if (end) throw end
          if (msg.value) {
            messages.unshift(msg)
          }
          emitter.emit('render')
          read(null, next)
        })
      }
    }
  )
}

function getUserNames(state, emitter, appName) {
  const app = state.apps[appName]
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
}

function getDisplayNameForUserId(userId, server, cb) {
  pull(
    server.query.read({
      reverse: true,
      limit: 1,
      query: [
        {
          $filter: {
            value: {
              author: userId,
              content: {
                type: 'about',
                name: {$is: 'string'}
              }
            },
            timestamp: { $gt: 0}
          }
        },
        {
          $map: {
            name: ['value', 'content', 'name']
          }
        }
      ]
    }),
    pull.drain(res => cb(null, res.name))
  )
}
