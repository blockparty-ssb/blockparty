'use strict'

const { ipcRenderer } = require('electron')
const connection = require('ssb-client')
const pull = require('pull-stream')
const choo = require('choo')
const h = require('hyperscript')
const { div, ul, body, li, input, button, section, h4 } =
  require('hyperscript-helpers')(h)

// choo app

const app = choo()
app.use(waitForConfigs)
app.route('/', view)
app.route('/test-network-1', view)
app.route('/test-network-2', view)
app.mount('body')

function waitForConfigs(state, emitter) {
  ipcRenderer.on('ssb-configs', (event, configs) => {
    const appIds = configs.map(c => c.appName)
    prepareStateAndListeners(state, emitter, appIds)
    configs.forEach(config => {
      connection(config.keys, config, (err, server) => {
        if (err) return console.log(err)
        state.server[config.appName] = server
        setInterval(function () {
          server.gossip.peers((err, peers) => {
            if (err) {
              console.log(err)
              return
            }
            state.peers[config.appName] = peers
            emitter.emit('render')
          })
        }, 8000) // peers als live-stream

        pull(
          server.createFeedStream({live: true}),
          pull.drain(msg => {
            if (!msg.value) return
            state.messages[config.appName].unshift(msg)
            emitter.emit('render')
          })
        )
        console.log('Success! Connected.')
      })
    })
  })
}

function prepareStateAndListeners(state, emitter, appIds) {
  state.activeApp = appIds[0]
  state.sbot = state.server[state.activeApp]
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

  emitter.on('DOMContentLoaded', () => {
    document.getElementById('publish').addEventListener('click', () => {
      state.sbot.publish({
        type: 'hello-world'
      }, err => console.log(err)) // sbot from createSbot needs a cb
    })

    document.getElementById('add-to-list').addEventListener('click', () => {
      const textField = document.getElementById('post')
      state.sbot.publish({
        type: 'post',
        text: textField.value
      }, err => console.log(err))
      textField.value = ''
    })

    document.getElementById('switch-app').addEventListener('click', () => {
      const otherAppId = appIds.find(id => id !== state.activeApp)
      state.activeApp = otherAppId
      // state.sbot = shelf[state.activeApp]
      emitter.emit('render')
    })
  })

  // wsClient(wsUrl, (err, stream) => {
  //   if (err) return console.log(err)
  //   console.log('got stream!')
  // })
}

const appIds = ['test-network-1', 'test-network-2']
function view(state) {
  // later we'll need some kind of loading screen
  const currentApp = state.activeApp || 'test-network-1'
  const colors = ['lightyellow', 'lightblue']
  const appIndex = appIds.indexOf(currentApp)
  const bg = `background-color:${colors[appIndex]}`
  return body({style: bg},
    div('.MainWindow',
      div('.SplitView',
        div('.side',
          div('.switch-app',
            button('#switch-app', 'Switch to other app')
          ),
          div('.show-peers',
            h4('Online peers:'),
            ul(state.peers && state.peers[currentApp].map(peer => li(peer.key)))
          )
        ),
        div('.main',
          div('.post-msg',
            input({type: "text", id: "post", name: "your message"}),
            button({ id: 'add-to-list' }, 'Post message')
          ),
          div('.say-hello',
            button({id: 'publish'}, 'say "hello world"')
          ),
          div('.feed',
            section('.content',
              state.messages && state.messages[currentApp].map(msg => {
                const m = msg.value
                let author = m.author.slice(1, 4)
                if (m.content.type === 'post') {
                  return div('.FeedEvent',`${author} says: ${m.content.text}`)
                } else if (m.content.type === 'hello-world') {
                  return div('.FeedEvent', `${author} says: ${m.content.type}`)
                }
              })
            )
          )
        )
      )
    )
  )
}
