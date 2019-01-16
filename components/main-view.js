'use strict'
const connect = require('ssb-client')
const markdown = require('ssb-markdown')
const { div, ul, li, button, h4, h2, input, textarea } =
  require('../html-helpers')
const computed = require('mutant/computed')
const map = require('mutant/map')
const friendlyTime = require('friendly-time')

module.exports = function (state) {
  const appNameObs = computed([state.activeApp], activeApp => activeApp.appName)
  const placeholderObs = computed([appNameObs], appName => 'Write a message in ' + appName)
  const messagesObs = computed([state.activeApp], a => a.messages)
  const userNamesObs = computed([state.activeApp], a => a.userNames)
  const inviteButtonObs = computed([state.activeApp], a => a.pubConfig ? makeInviteButton(a) : null)

  return div('.MainWindow', [
    div('.SplitMainView', [
      div('.sidebar', [
        div('.show-blockparty',
          h2(appNameObs)
        ),
        div('.username', [
          h4('You are:'),
          ul(map(userNamesObs, name => li(name))),
          input({id: "username"}),
          button({
            id: 'add-username',
            'ev-click': () => {
              const textfield = document.getElementById('username')
              state.activeApp().server.publish({
                type: 'about',
                name: textfield.value,
                about: state.activeApp().ownId
              }, err => console.log(err))
              textfield.value = ''
            }
          }, 'add username')
        ]),
        inviteButtonObs
      ]),
      div('.main', [
        div('.post-msg', [
          textarea({id: "post", attributes: {name: "your message", placeholder: placeholderObs}}),
          button({
            id: 'add-to-list',
            'ev-click': () => {
              const textField = document.getElementById('post')
              state.activeApp().server.publish({
                type: 'post',
                text: textField.value
              }, err => console.log(err))
              textField.value = ''
            }
          }, 'send')
        ]),
        div('.feed',
          map(messagesObs, msg => {
            const m = msg.value
            if (m.content.type === 'post') {
              return div('.FeedEvent', [
                div(m.displayName),
                div(friendlyTime(new Date(m.timestamp))),
                div('.postText', { innerHTML: markdown.block(m.content.text) })
              ])
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
    ]),
    div('#popup', [
      div('#close', {
        'ev-click': () => {
          document.getElementById('popup').style.display = 'none'
          document.getElementById('overlay').style.display = 'none'
        }
      }, 'x'),
      div('#invite-text',
        'Here is your invite code. Share it with your friends.'
      ),
      div('#invite-code'),
      button('#copy', {
        'ev-click': () => {
          let elm = document.getElementById('invite-code')
          let selection = window.getSelection()
          let range = document.createRange()
          range.selectNodeContents(elm)
          selection.removeAllRanges
          selection.addRange(range)
          document.execCommand('copy')
        }
      }, 'copy to clipboard')
    ]),
    div('#overlay')
  ])
}

function makeInviteButton(app) {
  return div('.username',
    button({
      id: 'invite',
      'ev-click': () => {
        const keys = app.keys
        connect(keys, app.pubConfig, (err, pub) => {
          if (err) return console.log(err)
          pub.invite.create(100, (err, code) => {
            // TODO
            if (err) return console.log(err)
            code = `${code}!${app.caps.shs}!${app.ownId}!${app.appName}`
            console.log(code)
            document.getElementById('popup').style.display = 'block'
            document.getElementById('overlay').style.display = 'block'
            document.getElementById('invite-code').innerHTML = code
          })
        })
      }
    }, 'create an invite code')
  )
}
