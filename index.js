'use strict'
const path = require('path')
const fs = require('fs')
const scuttleBot = require('scuttlebot')
const ssbClient = require('ssb-client')
const ssbKeys = require('ssb-keys')
const config = require('ssb-config/inject')
const pull = require('pull-stream')
const choo = require('choo')
const html = require('choo/html')

const createSbot = scuttleBot
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/gossip'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('scuttlebot/plugins/logging'))
  .use(require('ssb-ws'))

const appIds =
  fs.readFileSync(path.join(process.env.HOME, '.blockparty'), 'utf-8')
    .trim()
    .split('\n')

const app = choo()
app.use(setUpSbots)
app.route('/', view1)
app.route('/test-network-1', view1)
app.route('/test-network-2', view2)
app.mount('body')

function view1(state) {
  return html`
    <body style='background-color:lightyellow'>
      <a id="switch-to-app-2" href="/test-network-2">Switch to other app</a><br>  
      <input type="text" id="post" name="your message"/><br>
      <button id="add-to-list">Post message</button>  
      <br>
      <button id="publish">say "hello world"</button>
      <ol>
        ${state.messages.map(msg => {
          const m = msg.value
          let author = m.author.slice(1, 4)
          if (m.content.type === 'post') {
            return html`<li>${author} says: ${m.content.text}</li>`
          } else if (m.content.type === 'hello-world') {
            return html`<li>${author} says: ${m.content.type}</li>`
          }
        })}
      </ol>
    </body>
  `
}

function view2(state) {
  return html`
    <body style='background-color:lightgreen'>
      <button id="switch-to-app-1">Switch to other app</button><br>  
      <input type="text" id="post" name="your message"/><br>
      <button id="add-to-list">Post message</button>  
      <br>
      <button id="publish">say "hello world"</button>
      <ol>
        ${state.messages.map(msg => {
          const m = msg.value
          let author = m.author.slice(1, 4)
          if (m.content.type === 'post') {
            return html`<li>${author} says: ${m.content.text}</li>`
          } else if (m.content.type === 'hello-world') {
            return html`<li>${author} says: ${m.content.type}</li>`
          }
        })}
      </ol>
    </body>
  `
}

function setUpSbots(state, emitter) {
  appIds.forEach(appName => {
    const ssbConfig = config(appName)
    const keys = ssbKeys.loadOrCreateSync(path.join(ssbConfig.path, 'secret'))
    ssbConfig.keys = keys
    state.messages = []
    const sbot = createSbot(ssbConfig)
    ssbConfig.remote = sbot.getAddress()
    ssbClient(keys, ssbConfig, (err, sbot) => {
      if (err) return console.log(err)
      sbot.gossip.peers((err, peers) => {
        console.log(err)
        console.log(peers)
      })

      document.getElementById('publish').addEventListener('click', () => {
        sbot.publish({
          type: 'hello-world'
        })
      })

      document.getElementById('add-to-list').addEventListener('click', () => {
        const textField = document.getElementById('post')
        sbot.publish({
          type: 'post',
          text: textField.value
        })
        textField.value = ''
      })

      pull(
        sbot.createFeedStream({live: true}),
        pull.drain(msg => {
          if (!msg.value) return
          state.messages.push(msg)
          emitter.emit('render')
        })
      )
    })
  })
}
