'use strict'
const { div, ul, li, button, h4, h2, input } =
  require('../html-helpers')

module.exports = function (state) {
  const currentApp = state.apps.get(state.activeApp())
  return div('.MainWindow',
    div('.SplitMainView',
      div('.sidebar',
        div('.show-blockparty',
          h2(state.activeApp)),
        div('.show-peers', [
          h4('Online peers:'),
          ul(currentApp.peers.map(peer => {
            return div('.list-of-peers',
              li(peer.displayName, [
                button({ 'ev-click': () => {
                  currentApp.server.publish({
                    type: 'contact',
                    contact: peer.key,
                    following: true
                  }, err => console.log(err))
                }}, 'Follow'),
                button({ 'ev-click': () => {
                  currentApp.server.publish({
                    type: 'contact',
                    contact: peer.key,
                    following: false
                  }, err => console.log(err))
                }}, 'Unfollow')
              ])
            )
          }))
          
        ])
        ),
        div('.username',
          h4('You are:'),
          ul(currentApp.userNames.map(name => li(name))),
          input({id: "username"}),
          button('Add username', {
            id: 'add-username',
            'ev-click': () => {
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
          input({id: "post", name: "your message", placeholder: 'Write a message in ' + state.activeApp }),
          button( 'send', {
            id: 'add-to-list',
            'ev-click': () => {
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
          id: 'load-more'
          // 'ev-click': () => emit('get-messages', state.activeApp)
        })
      )
    )
  )
}
