'use strict'
const h = require('hyperscript')
const { div, ul, body, li, input, button, section, h4, a, img } =
  require('hyperscript-helpers')(h)
const onLoad = require('on-load')

module.exports = (state, emit) => {
  const appIds = Object.keys(state.apps)
  const currentApp = state.apps[state.activeApp]
  const colors = ['lightyellow', 'lightblue']
  const appIndex = appIds.indexOf(state.activeApp)
  const bg = `background-color:${colors[appIndex]}`
  const app = body({style: bg},
    div('.blockparties',
      ul('.list-blockparties',
        li('.blockparty',
          a('#blockparty1-link',
            {href: '#'},
            div('.blockparty-icon',
              img('.blockparty-img',
                {src: `https://ui-avatars.com/api/?name=${appIds[0]}&background=f9f7bb&color=fff`}
              )
            )
          )
        ),
        li('.blockparty',
          a('#blockparty2-link',
            {href: '#'},
            div('.blockparty-icon',
              img('.blockparty-img',
                {src: `https://ui-avatars.com/api/?name=${appIds[1]}&background=c7ddfc&color=fff`}
              )
            )
          )
        )
      )
    ),
    div('.MainWindow',
      div('.SplitView',
        div('.sidebar',
          div('.show-peers',
            h4('Online peers:'),
            ul(currentApp.peers.map(peer => li(peer.key)))
          ),
          div('.switch-app',
            h4('You are:'),
            ul(currentApp.userNames.map(name => li(name))),
            input({type: "text", id: "username"}),
            button({ id: 'add-username' }, 'Add username')
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

  document.getElementById('blockparty1-link').addEventListener('click', () => {
    state.activeApp = appIds[0]
    emit('render')
  })

  document.getElementById('blockparty2-link').addEventListener('click', () => {
    state.activeApp = appIds[1]
    emit('render')
  })

  document.getElementById('add-username').addEventListener('click', () => {
    const textField = document.getElementById('username')
    app.server.publish({
      type: 'about',
      name: textField.value
    }, err => console.log(err))
    textField.value = ''
  })
}
