'use strict'
const ssbClient = require('ssb-client')
const pull = require('pull-stream')
const choo = require('choo')
const html = require('choo/html')

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
  state.messages = []
  ssbClient(process.env.ssb_appname, (err, sbot) => {
    if (err) return console.log(err)
    document.getElementById('publish').addEventListener('click', () => {
      sbot.publish({
        type: 'hello-world'
      })
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
}
