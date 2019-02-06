'use strict'
const { shell } = require('electron')
const mutantValue = require('mutant/value')
const computed = require('mutant/computed')
const { div, button, p, h2, h3, section, select, input, option } =
  require('../html-helpers')
const slugify = require('slugify')
const {wizard} = require('../labels')
const getSizes = require('../get-sizes')
const installOnDigitalOcean = require('../install-on-digital-ocean')
const ssbKeys = require('ssb-keys')
const crypto = require('crypto')

const pageObs = mutantValue('enterName')

module.exports = function (cb) {
  const appIdObs = mutantValue()
  const apiKeyObs = mutantValue()
  const doSizesObs = mutantValue()
  const doRegionsObs = mutantValue()
  const sizeObs = mutantValue()
  const regionObs = mutantValue()
  const wizardPages = {
    enterName: section('.wizard-page', [
      div('.wrapper', [
        h2('Create a new community or join an existing one!'),
        div('.box', [
          h3(wizard.enterAppId),
          input('#wizard-app-id', {attributes: {required: true}}),
          button('.button-continue .app-button', {'ev-click': () => {
            const wizardInput = document.getElementById('wizard-app-id').value
            if (!wizardInput) {
              return
            }
            appIdObs.set(wizardInput)
            pageObs.set('hasAccount')
          }}, wizard.continue)
        ])
      ])
    ]),
    hasAccount: section('.wizard-page', [
      div('.wrapper', [
        h2(wizard.haveAccount),
        div('.box', [
          h3(wizard.accountNo),
          p(wizard.getDOAccount),
          button('#make-account .app-button', {'ev-click': () => shell.openExternal(wizard.dOURL)}, wizard.goToDO)
        ]),
        div('.box', [
          h3(wizard.accountYes),
          p(wizard.giveApiKey),
          input({id: 'wizard-api-key'}),
          div('.button-group', [
            makeCancelButton(),
            button('.button-continue .app-button', {'ev-click': async () => {
              const apiKeyValue = document.getElementById('wizard-api-key').value
              apiKeyObs.set(apiKeyValue)
              pageObs.set('sizeAndRegion')
              var spinner = document.getElementById('loader')
              spinner.style.display = 'block'
              let sizes
              try {
                sizes = await getSizes(apiKeyValue)
              } catch (err) {
                return cb(err)
              }
              doSizesObs.set(sizes)
              spinner.style.display = 'none'
            }}, wizard.continue)
          ])
        ])
      ])
    ]),
    sizeAndRegion: section('.wizard-page', [
      div('.wrapper', [
        h2(wizard.chooseOptions),
        div('.box', [
          div('.selection',
            select(
              {'ev-change': ev => {
                const chosenSize = ev.target.value
                if (!chosenSize) {
                  doRegionsObs.set(null)
                  return
                }
                const matchSize = doSizesObs().find(item => item.slug === chosenSize)
                doRegionsObs.set(matchSize.regions)
                sizeObs.set(chosenSize)
              }},
              computed([doSizesObs], sizes => {
                if (!sizes) return
                return sizes.reduce((selectOptions, size) => {
                  selectOptions.push(option({value: size.slug}, size.slug))
                  return selectOptions
                }, [option({value: ""}, "Please choose")])
              })
            )
          ),
          div('.selection',
            select(
              {'ev-change': ev => regionObs.set(ev.target.value)},
              computed([doRegionsObs], regions => regions && regions.map(region => option(region)))
            )
          ),
          div('.button-group', [
            makeCancelButton(),
            button('.button-continue .app-button', {'ev-click': () => {
              pageObs.set('confirmation')
            }}, wizard.yesCreate)
          ])
        ])
      ])
    ]),
    confirmation: section('.wizard-page', [
      div('.wrapper', [
        h2(wizard.confirmation),
        div('.box', [
          p(appIdObs),
          p(apiKeyObs),
          p(sizeObs),
          p(regionObs),
          div('.button-group', [
            makeCancelButton(),
            button('.button-continue .app-button', {'ev-click': async () => {
              const port = Math.floor(50000 + 15000 * Math.random())
              const wsPort = port + 1
              const appId = crypto.randomBytes(32).toString('base64')
              const keys = ssbKeys.generate()
              const appName = slugify(appIdObs())
              pageObs.set('wait')
              const pubInfo = {
                name: appName,
                apiToken: apiKeyObs(),
                size: sizeObs(),
                region: regionObs(),
                port,
                wsPort,
                userKey: keys.id,
                appId
              }
              try {
                const {ip, key} = await installOnDigitalOcean(pubInfo)
                cb(null, {appId, port, wsPort, appName, keys, pubKey: key, ip})
              } catch (err) {
                cb(err)
              } finally {
                [appIdObs, apiKeyObs, sizeObs, regionObs].forEach(obs => obs.set(null))
              }
            }}, wizard.yesCreate)
          ])
        ])
      ])
    ]),
    wait: section('.wizard-page', [
      div('.wrapper', [
        h2(wizard.paintWhileWaiting),
        p(wizard.takeSomeTime)
      ])
    ])
  }

  function makeCancelButton() {
    return button('.button-cancel .app-button',
      // TODO
      {'ev-click': () => {}},
      wizard.cancel)
  }

  return div('#wizard-view', computed(pageObs, pageName => wizardPages[pageName]))
}
