'use strict'
const h = require('hyperscript')
const { div, ul, body, li, input, button, section, h4 } =
  require('hyperscript-helpers')(h)
const onLoad = require('on-load')

module.exports = (state, emit) => {
  const appIds = Object.keys(state.apps)
  const currentApp = state.apps[state.activeApp]
  const colors = ['lightyellow', 'lightblue']
  const appIndex = appIds.indexOf(state.activeApp)
  const bg = `background-color:${colors[appIndex]}`
  const app = body({style: bg},
    div('.MainWindow',
      div('.SplitView',
        div('.side',
          div('.switch-app',
            button('#switch-app', 'Switch to other app')
          ),
          div('.show-peers',
            h4('Online peers:'),
            ul(currentApp.peers.map(peer => li(peer.key)))
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
              currentApp.messages.map(msg => {
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
  onLoad(app, () => setupDOMListeners(currentApp, state, emit, appIds))
  return app
}

function setupDOMListeners(app, state, emit, appIds) {
  document.getElementById('publish').addEventListener('click', () => {
    app.server.publish({
      type: 'hello-world'
    }, err => console.log(err))
  })

  document.getElementById('add-to-list').addEventListener('click', () => {
    const textField = document.getElementById('post')
    app.server.publish({
      type: 'post',
      text: textField.value
    }, err => console.log(err))
    textField.value = ''
  })

  document.getElementById('switch-app').addEventListener('click', () => {
    const otherAppId = appIds.find(id => id !== state.activeApp)
    state.activeApp = otherAppId
    emit('render')
  })
}
