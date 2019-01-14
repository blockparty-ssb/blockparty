'use strict'
const connect = require('ssb-client')
const markdown = require('ssb-markdown')
const { div, ul, li, button, h4, h2, input } =
  require('../html-helpers')
const computed = require('mutant/computed')
const map = require('mutant/map')
const friendlyTime = require('friendly-time')
const {exec, init} = require('pell')
const TurndownService = require('turndown')

module.exports = function (state) {
  const appNameObs = computed([state.activeApp], activeApp => activeApp.appName)
  const placeholderObs = computed([appNameObs], appName => 'Write a message in ' + appName)
  const messagesObs = computed([state.activeApp], a => a.messages)
  const userNamesObs = computed([state.activeApp], a => a.userNames)
  const inviteButtonObs = computed([state.activeApp], a => a.pubConfig ? makeInviteButton(a) : null)
  let pellAlreadyInitiated = false
  let html

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
          div({
            id: 'compose-message',
            attributes: {
              name: "your message",
              placeholder: placeholderObs
            },
            onload: () => {
              if (!document.getElementById('compose-message')) return
              if (pellAlreadyInitiated) return
              console.log('loaded')
              console.log(document.getElementById('compose-message'))
              pellAlreadyInitiated = true
              init({
                element: document.getElementById('compose-message'),
                onChange: newHTML => {
                  html = newHTML
                },
                defaultParagraphSeparator: 'p',
                styleWithCSS: true,
                actions: [
                  'bold',
                  'heading1',
                  'underline',
                  {
                    name: 'italic',
                    result: () => exec('italic')
                  },
                  {
                    name: 'backColor',
                    icon: '<div style="background-color:pink;">A</div>',
                    title: 'Highlight Color',
                    result: () => exec('backColor', 'pink')
                  },
                  {
                    name: 'image',
                    result: () => {
                      const url = window.prompt('Enter the image URL')
                      if (url) exec('insertImage', url)
                    }
                  },
                  {
                    name: 'link',
                    result: () => {
                      const url = window.prompt('Enter the link URL')
                      if (url) exec('createLink', url)
                    }
                  }
                ],
                classes: {
                  actionbar: 'pell-actionbar-custom-name',
                  button: 'pell-button-custom-name',
                  content: 'compose-message',
                  selected: 'pell-button-selected-custom-name'
                }
              })
            }
          }),
          button({
            id: 'add-to-list',
            'ev-click': () => {
              const textField = document.getElementsByClassName('compose-message')[0]
              const turndownService = new TurndownService()
              console.log(html)
              const md = turndownService.turndown(html)
              console.log(md)
              state.activeApp().server.publish({
                type: 'post',
                text: md
              }, err => console.log(err))
              html = ''
              textField.innerHTML = ''
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


