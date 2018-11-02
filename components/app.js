'use strict'
const h = require('hyperscript')
const { div, ul, body, li, button, h4, a, img } =
  require('hyperscript-helpers')(h)
const onLoad = require('on-load')
const loadingScreen = require('./loading-screen')
const textField = require('./input-field')

module.exports = (state, emit) => {
  if (!state.apps) return loadingScreen()
  const appIds = Object.keys(state.apps)
  const currentApp = state.apps[state.activeApp]
  const colors = ['lightyellow', 'lightblue']
  const appIndex = appIds.indexOf(state.activeApp)
  const bg = `background-color:${colors[appIndex]}`
  const appMarkup = body({style: bg},
    div('.SplitView',
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
              ul(currentApp.peers.map(peer => {
                return div('.list-of-peers',
                  li(peer.displayName,
                    button({ onclick: () => {
                      currentApp.server.publish({
                        type: 'contact',
                        contact: peer.key,
                        following: true
                      }, err => console.log(err))
                    }}, 'Follow'),
                    button({ onclick: () => {
                      currentApp.server.publish({
                        type: 'contact',
                        contact: peer.key,
                        following: false
                      }, err => console.log(err))
                    }}, 'Unfollow')
                  )
                )
              }))
            ),
            div('.switch-app',
              h4('You are:'),
              ul(currentApp.userNames.map(name => li(name))),
              textField({id: "username"}),
              button({ id: 'add-username' }, 'Add username')
            )
          ),
          div('.main',
            div('.post-msg',
              textField({id: "post", name: "your message" }),
              button({ id: 'add-to-list' }, 'Post message')
            ),
            div('.say-hello',
              button({id: 'publish'}, 'say "hello world"')
            ),
            div('.feed',
              currentApp.messages.map(msg => {
                const m = msg.value
                if (m.content.type === 'post') {
                  return div('.FeedEvent',`${m.displayName} says: ${m.content.text}`)
                } else if (m.content.type === 'hello-world') {
                  return div('.FeedEvent', `${m.displayName} says: ${m.content.type}`)
                }
              })
            ),
            button('#load-more', 'Load more')
          )
        )
      )
    )
  )
  onLoad(appMarkup, () => setupDOMListeners(state, emit, appIds))
  return appMarkup
}

function setupDOMListeners(state, emit, appIds) {
  document.getElementById('publish').addEventListener('click', () => {
    getActiveApp().server.publish({
      type: 'hello-world'
    }, err => console.log(err))
  })

  document.getElementById('add-to-list').addEventListener('click', () => {
    const textField = document.getElementById('post')
    getActiveApp().server.publish({
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
    getActiveApp().server.publish({
      type: 'about',
      name: textField.value,
      about: getActiveApp().ownId
    }, err => console.log(err))
    textField.value = ''
  })

  document.getElementById('load-more').addEventListener('click', () => {
    emit('get-messages')
  })


  function getActiveApp() {
    return state.apps[state.activeApp]
  }
}
