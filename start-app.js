/* eslint-disable new-cap */
'use strict'
const connection = require('ssb-client')
const pull = require('pull-stream')
const mutantArray = require('mutant/array')
const paraMap = require('pull-paramap')
const Value = require('mutant/value')
const batchSize = 100

module.exports = function(state, config, isFirst) {
  addAppToState(state, config)
  const app = state.apps.get(config.appName)
  if (isFirst) {
    state.activeApp.set(app)
  }
  connection(config.keys, config, (err, server) => {
    // TODO Handle error
    if (err) return console.log(err)
    app.server = server
    setUpMessageStream(app)
    getuserName(app)
  })
}

function addAppToState(state, appConfig) {
  state.apps.put(appConfig.appName, Object.assign(appConfig, {
    messages: mutantArray(),
    userName: Value()
  }))
}

function setUpMessageStream(app) {
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
          if (msg.value) messages.insert(msg, 0)
          read(null, next)
        })
      }
    }
  )
}

function getuserName(app) {
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
      app.userName.set(msg.value.content.name)
    })
  )
}
