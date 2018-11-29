'use strict'
const { div, ul, li, button, h4, h2, input } =
  require('../html-helpers')
const computed = require('mutant/computed')
const map = require('mutant/map')

module.exports = function (state) {
  const appNameObs = computed([state.activeApp], activeApp => activeApp.name)
  const placeholderObs = computed([appNameObs], appName => 'Write a message in ' + appName)
  const messagesObs = computed([state.activeApp], a => a.messages)
  const userNamesObs = computed([state.activeApp], a => a.userNames)

  return div('.MainWindow',
    div('.SplitMainView', [
      div('.sidebar', [
        div('.show-blockparty',
          h2(appNameObs)
        ),
        div('.username', [
          h4('You are:'),
          ul(map(userNamesObs, name => li(name))),
          input({id: "username"}),
          // button({
          //   id: 'add-username',
          //   'ev-click': () => {
          //     const textfield = document.getelementbyid('username')
          //     currentapp.server.publish({
          //       type: 'about',
          //       name: textfield.value,
          //       about: currentapp.ownid
          //     }, err => console.log(err))
          //     textfield.value = ''
          //   }
          // }, 'add username')
        ])
      ]),
      div('.main', [
        div('.post-msg', [
          input({id: "post", attributes: {name: "your message", placeholder: placeholderObs}}),
          button({
            id: 'add-to-list',
            'ev-click': () => {
              const textField = document.getElementById('post')
              /*  currentApp.server.publish({
                type: 'post',
                text: textField.value
              }, err => console.log(err)) */
              textField.value = ''
            }
          }, 'send')
        ]),
        div('.feed',
          map(messagesObs, msg => {
            const m = msg.value
            if (m.content.type === 'post') {
              return div('.FeedEvent',`${m.displayName} says: ${m.content.text}`)
            } else if (m.content.type === 'hello-world') {
              return div('.FeedEvent', `${m.displayName} says: ${m.content.type}`)
            }
          })
        ),
        button({
          id: 'load-more'
          // 'ev-click': () => emit('get-messages', state.activeApp)
        }, 'Load more')
      ])
    ])
  )
}
