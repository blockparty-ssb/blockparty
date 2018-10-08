'use strict'
const path = require('path')
const sbot = require('scuttlebot')
const ssbClient = require('ssb-client')
const ssbKeys = require('ssb-keys')
const config = require('ssb-config/inject')
const pull = require('pull-stream')
const choo = require('choo')
const html = require('choo/html')

const createSbot = sbot
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('scuttlebot/plugins/logging'))
  .use(require('ssb-ws'))

const app = choo()
app.use(setUpSbot)
app.route('/', mainView)
app.mount('body')

function mainView (state) {
  return html`
    <body>
      <button id="publish">say "hello world"</button>
      <ol>
        ${state.messages.map(msg => {
          const m = msg.value
          const author = m.author.slice(1, 4)
          return html`<li>${author} says: ${m.content.type}</li>`
        })}
      </ol>
    </body>
  `
}

function setUpSbot(state, emitter) {
  const appName = process.env.ssb_appname
  const ssbConfig = config(appName)
  ssbConfig.keys = ssbKeys.loadOrCreateSync(path.join(ssbConfig.path, 'secret'))
  createSbot(ssbConfig)
  // until we know how to find out when createSbot is done
  setImmediate(() => {
    ssbClient(appName, (err, sbot) => {
      if (err) return console.log(err)
      document.getElementById('publish').addEventListener('click', () => {
        sbot.publish({
          type: 'hello-world'
        })
      })

      state.messages = []
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
