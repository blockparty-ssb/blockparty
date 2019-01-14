'use strict'
const connection = require('ssb-client')
const pull = require('pull-stream')
const mutantArray = require('mutant/array')
const paraMap = require('pull-paramap')
const batchSize = 100

module.exports = function(state, config, isFirst) {
  addAppToState(state, config)
  const app = state.apps.get(config.appName)
  if (isFirst) {
    state.activeApp.set(app)
  }
  connection(config.keys, config, (err, server) => {
    if (err) return console.log(err)
    app.server = server
    setUpMessageStream(app)
    getUserNames(app)
  })
}

function addAppToState(state, appConfig) {
  state.apps.put(appConfig.appName, Object.assign(appConfig, {
    messages: mutantArray(),
    userNames: mutantArray()
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
      console.log('in paramap', msg.value.content)
      const userId = msg.value.author
      console.log('user id', userId)
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
          console.log('found name', name.name)
          msg.value.displayName = name.name
          console.log('calling read callback with ', msg)
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
        console.log('get bath of messages')
        // TODO actually use batching again
        read(null, function next(end, msg) {
          console.log('got msg in read')
          console.log(end)
          if (end === true) return
          if (end) throw end
          if (msg.value) {
            console.log(msg.value)
            messages.insert(msg, 0)
          }
          console.log('calling read again')
          read(null, next)
        })
      }
    }
  )
}

function getUserNames(app) {
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
