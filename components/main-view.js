/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
'use strict'
const connect = require('ssb-client')
const markdown = require('ssb-markdown')
const { div, p, button, h4, h2, span, input, img } =
  require('../html-helpers')
const computed = require('mutant/computed')
const Map = require('mutant/map')
const friendlyTime = require('friendly-time')
const makeErrorMessage = require('./error-message')
const {errors, invite} = require('../labels')
const {exec, init} = require('pell')
const TurndownService = require('turndown')
const spinner = require('./spinner')

module.exports = function (state) {
  const appNameObs = computed([state.activeApp], activeApp => activeApp.appName)
  const placeholderObs = computed([appNameObs], appName => 'Write a message in ' + appName)
  const messagesObs = computed([state.activeApp], a => a.messages)
  const userNamesObs = computed([state.activeApp], a => a.userNames)
  const inviteButtonObs = computed([state.activeApp], a => a.pubConfig ? makeInviteButton(a) : null)
  let html

  return div('.MainWindow', [
    div('.SplitMainView', [
      div('.sidebar', [
        div('.show-blockparty',
          h2(appNameObs)
        ),
        div('.username', [
          h4(['Your username:  ', userNamesObs]),
          input({id: "username"}),
          div('#add-username .app-button',
            {
              'ev-click': () => {
                const textfield = document.getElementById('username')
                state.activeApp().server.publish({
                  type: 'about',
                  name: textfield.value,
                  about: state.activeApp().ownId
                }, err => {
                  if (err) return showErrorMessage(
                    errors.couldNotPublishUsername.title,
                    errors.couldNotPublishUsername.text
                  )
                })
                textfield.value = ''
              }
            }, 'add username')
        ]),
        inviteButtonObs
      ]),
      div('.main', [
        div('.editor', [
          div({
            id: 'compose-message',
            attributes: {
              name: "your message",
              placeholder: placeholderObs
            },
            hooks: [() => {
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
                  actionbar: 'actionbar',
                  button: 'editor-button',
                  content: 'compose-message',
                  selected: 'editor-button-selected'
                }
              })
            }
            ]
          })
        ]),
        button('#publish-msg-button .app-button', {
          'ev-click': () => {
            const textField = document.getElementsByClassName('compose-message')[0]
            const spinnerStyle = document.querySelector('#publish-msg-button .spinner').style
            const turndownService = new TurndownService()
            const md = turndownService.turndown(html)
            if (!md) return
            spinnerStyle.display = 'inline'
            state.activeApp().server.publish({
              type: 'post',
              text: md
            }, err => {
              spinnerStyle.display = 'none'
              if (err) return showErrorMessage(
                errors.couldNotPublishMessage.title,
                errors.couldNotPublishMessage.text
              )
            })
            html = ''
            textField.innerHTML = ''
          }
        }, [spinner, 'send']),
        div('.feed',
          Map(messagesObs, msg => {
            const m = msg.value
            if (m.content.type === 'post') {
              return div('.FeedEvent', [
                div([
                  span('.author', m.displayName),
                  span('.date', friendlyTime(new Date(m.timestamp)))
                ]),
                div('.postText', { innerHTML: markdown.block(m.content.text) })
              ])
            } else if (m.content.type === 'hello-world') {
              return div('.FeedEvent', `${m.displayName} says: ${m.content.type}`)
            }
          })
        )
      ])
    ]),
    div('#popup', [
      div([
        div('.top .successTop', [
          img('.success-icon', {src: 'styles/img/success.png'}),
          h2('.message-title', invite.title)
        ]),
        div('.bottom', [
          h4(invite.text),
          p('#invite-code'),
          div('.buttons', [
            button('#copy .app-button', {
              'ev-click': () => {
                let elm = document.getElementById('invite-code')
                let selection = window.getSelection()
                let range = document.createRange()
                range.selectNodeContents(elm)
                selection.removeAllRanges
                selection.addRange(range)
                document.execCommand('copy')
              }
            }, 'copy to clipboard'),
            button('.app-button .button-cancel', {
              'ev-click': () => {
                document.getElementById('popup').style.display = 'none'
                document.getElementById('overlay').style.display = 'none'
              }
            }, 'close')
          ])
        ])
      ])
    ]),
    div('#overlay')
  ])

  function makeInviteButton(app) {
    return div('.invite',
      button('#invite .app-button', {
        'ev-click': () => {
          const keys = app.keys
          const spinnerStyle = document.querySelector('.invite .spinner').style
          spinnerStyle.display = 'inline'
          connect(keys, app.pubConfig, (err, pub) => {
            if (err) {
              return showErrorMessage(errors.couldNotConnect.title, errors.couldNotConnect.text)
            }
            pub.invite.create(100, (err, code) => {
              spinnerStyle.display = 'none'
              if (err) {
                return showErrorMessage(errors.couldNotCreate.title, errors.couldNotCreate.text)
              }

              code = `${code}!${app.caps.shs}!${app.ownId}!${app.appName}`
              document.getElementById('popup').style.display = 'block'
              document.getElementById('overlay').style.display = 'block'
              document.getElementById('invite-code').innerHTML = code
            })
          })
        }
      },
      [spinner,'create an invite code'])
    )
  }

  function showErrorMessage (title, text) {
    const errorHTML = makeErrorMessage(title, text, () => {
      state.error.set(null)
    })
    state.error.set(errorHTML)
    return
  }
}
