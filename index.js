'use strict'

const { ipcRenderer } = require('electron')
const connection = require('ssb-client')
const pull = require('pull-stream')
const paraMap = require('pull-paramap')
const mutantStruct = require('mutant/struct')
const mutantDict = require('mutant/dict')
const appView = require('./components/app')

const batchSize = 100

const state = mutantStruct({
  wizard: {},
  wizardActive: false,
  activeApp: null,
  noApps: false,
  apps: mutantDict({})
})

waitForConfig(state)

function waitForConfig(state) {
  ipcRenderer.on('no-apps-found', () => state.noApps.set(true))
  ipcRenderer.on('initial-active', (event, appName) => {
    state.activeApp.set(appName)
  })

  ipcRenderer.on('ssb-config', (event, config) => {
    console.log('got config')
    addAppToState(state, config.appName)
    connection(config.keys, config, (err, server) => {
      if (err) return console.log(err)
      const app = state.apps.get(config.appName)
      app.server = server
      app.ownId = config.keys.id
      setInterval(function () {
        // TODO find out how to filter for local peers only
        server.gossip.peers((err, peers) => {
          if (err) {
            console.log(err)
            return
          }
          app.peers = peers
          peers.forEach(peer => {
            getDisplayNameForUserId(peer.key, server, (err, name) => {
              peer.displayName = name
            })
          })
        })
      }, 5000)
      setUpMessageStream(state, config.appName)
      getUserNames(state, config.appName)
    })
  })
}

function addAppToState(state, appId) {
  state.apps.put(appId, {
    messages: [],
    peers: [],
    userNames: []
  })
}

function setUpMessageStream(state, appName) {
  const getResultFromDatabase = state.apps.get(appName).server.query.read
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
      getBatchOfMessages(state.apps.get(appName).messages)
      // emitter.on('get-messages', targetApp => {
      //   if (targetApp === appName) {
      //     getBatchOfMessages(state.apps.get(appName].messages)
      //   }
      // })

      function getBatchOfMessages(messages) {
        // TODO actually use batching again
        read(null, function next(end, msg) {
          if (end === true) return
          if (end) throw end
          if (msg.value) {
            messages.unshift(msg)
          }
          read(null, next)
        })
      }
    }
  )
}

function getUserNames(state, appName) {
  const app = state.apps.get(appName)
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

const appMarkup = appView(state)
document.body.appendChild(appMarkup)
