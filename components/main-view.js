'use strict'
const h = require('hyperscript')
const { div, ul, li, button, h4 } =
  require('hyperscript-helpers')(h)
const textField = require('./input-field')

module.exports = function (state, emit) {
  const currentApp = state.apps[state.activeApp]
  return div('.MainWindow',
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
          button('Add username', {
            id: 'add-username',
            onclick: () => {
              const textField = document.getElementById('username')
              currentApp.server.publish({
                type: 'about',
                name: textField.value,
                about: currentApp.ownId
              }, err => console.log(err))
              textField.value = ''
            }
          })
        )
      ),
      div('.main',
        div('.post-msg',
          textField({id: "post", name: "your message" }),
          button( 'Post message', {
            id: 'add-to-list',
            onclick: () => {
              const textField = document.getElementById('post')
              currentApp.server.publish({
                type: 'post',
                text: textField.value
              }, err => console.log(err))
              textField.value = ''
            }
          })
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
        button('Load more', {
          id: 'load-more',
          onclick: () => emit('get-messages', state.activeApp)
        })
      )
    )
  )
}
