'use strict'
const h = require('hyperscript')
const { div, ul, body, li, input, button, section, h4 } =
  require('hyperscript-helpers')(h)
const onLoad = require('on-load')

module.exports = (state, emit) => {
  const appIds = ['test-network-1', 'test-network-2']
  const currentApp = state.activeApp || 'test-network-1'
  const colors = ['lightyellow', 'lightblue']
  const appIndex = appIds.indexOf(currentApp)
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
            ul(state.peers[currentApp] && state.peers[currentApp].map(peer => li(peer.key)))
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
              state.messages[currentApp] && state.messages[currentApp].map(msg => {
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
  onLoad(app, () => setupDOMListeners(state, emit, appIds))
  return app
}

function setupDOMListeners(state, emit, appIds) {
  document.getElementById('publish').addEventListener('click', () => {
    state.servers[state.activeApp].publish({
      type: 'hello-world'
    }, err => console.log(err))
  })

  document.getElementById('add-to-list').addEventListener('click', () => {
    const textField = document.getElementById('post')
    state.servers[state.activeApp].publish({
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
