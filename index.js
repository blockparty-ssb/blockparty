'use strict'

const { ipcRenderer } = require('electron')
const connection = require('ssb-client')
const pull = require('pull-stream')
const paraMap = require('pull-paramap')
const mutantStruct = require('mutant/struct')
const mutantDict = require('mutant/dict')
const appView = require('./components/app')
const mutantArray = require('mutant/array')

const batchSize = 100

const state = mutantStruct({
  wizard: mutantDict(),
  wizardActive: false,
  activeApp: {},
  noApps: false,
  apps: mutantDict({})
})

waitForConfig(state)

function waitForConfig(state) {
  let isFirst = true
  ipcRenderer.on('no-apps-found', () => state.noApps.set(true))

  ipcRenderer.on('ssb-config', (event, config) => {
    addAppToState(state, config)
    const app = state.apps.get(config.appName)
    if (isFirst) {
      state.activeApp.set(app)
      isFirst = false
    }
    connection(config.keys, config, (err, server) => {
      if (err) return console.log(err)
      app.server = server
      setUpMessageStream(state, app)
      getUserNames(state, app)
    })
  })
}

function addAppToState(state, appConfig) {
  state.apps.put(appConfig.appName, Object.assign(appConfig, {
    messages: mutantArray(),
    userNames: mutantArray()
  }))
}

function setUpMessageStream(state, app) {
  const getResultFromDatabase = app.server.query.read
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
      getBatchOfMessages(app.messages)
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
            messages.insert(msg, 0)
          }
          read(null, next)
        })
      }
    }
  )
}

function getUserNames(state, app) {
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
      app.userNames.insert(msg.value.content.name, 0)
    })
  )
}

ipcRenderer.on('network-created', (event, {appName, pubConnectionConfig}) => {
  const newApp = state.apps.get(appName)
  state.activeApp.set(newApp)
  newApp.pubConfig = pubConnectionConfig
  state.wizardActive.set(false)
})

const appMarkup = appView(state)
document.body.appendChild(appMarkup)
