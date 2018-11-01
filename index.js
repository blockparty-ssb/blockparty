'use strict'

const { ipcRenderer } = require('electron')
const connection = require('ssb-client')
const choo = require('choo')
const pull = require('pull-stream')
const appView = require('./components/app')

const batchSize = 3

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
            let peersWithDisplayName = 0
            peers.forEach(peer => {
              getDisplayNameForUserId(peer.key, server, (err, name) => {
                peer.displayName = name
                peersWithDisplayName++
                if (peersWithDisplayName === peers.length - 1) {
                  emitter.emit('render')
                }
              })
            })
          })
        }, 4000) // peers as live-stream

        // TODO later this needs to become an async-map or similar
        if (Object.keys(state.apps).every(app => state.apps[app].server)) {
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
    const getResultFromDatabase = state.apps[state.activeApp].server.query.read
    pull(
      getResultFromDatabase({
        reverse: true,
        query: [{$filter: {
          value: { content: { type: 'post' }}
        }}]
      }),
      function getDisplayNameForMsg(read) {
        return function readable (end, cb) {
          read(end, function (end, msg) {
            if (end === true) cb(true)
            if (end) throw end
            const userId = msg.value.author
            pull(
              getResultFromDatabase({
                reverse: true,
                limit: 8,
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
          })
        }
      },
      read => {
        getBatchOfMessages(state.apps[state.activeApp].messages)
        emitter.on('get-messages', () => {
          getBatchOfMessages(state.apps[state.activeApp].messages)
        })

        function getBatchOfMessages(messages) {
          let counter = 0
          read(null, function next(end, msg) {
            if (end === true) return console.log('end')
            if (end) throw end
            if (!msg.value) return
            messages.push(msg)
            console.log('length', messages.length)
            if (counter < batchSize) {
              read(null, next)
            }
            counter++
            emitter.emit('render')
          })
        }
      }
    )
  })
}

function getUserNames(state, emitter) {
  emitter.on('get-user-names', () => {
    Object.values(state.apps).forEach(app => {
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
  })
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
