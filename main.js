/* eslint-disable quote-props */
'use strict'
const path = require('path')
const fs = require('fs')

const {app, BrowserWindow, ipcMain} = require('electron')
const startSbot = require('./server.js')
const ssbKeys = require('ssb-keys')
const injectConfig = require('./inject')
const createNetwork = require('./create-network')
const blockpartyDir = require('./blockparty-dir')

let mainWindow

function createWindow (ssbConfigs) {
  mainWindow = new BrowserWindow()

  mainWindow.loadFile('index.html')

  mainWindow.webContents.openDevTools()
  mainWindow.maximize()
  mainWindow.webContents.on('dom-ready', () => {
    if (!ssbConfigs.length) {
      sendToWindow('no-apps-found')
      return
    }
    ssbConfigs.forEach(ssbConfig => {
      sendToWindow('ssb-config', ssbConfig)
    })
    sendToWindow('apps-found')
  })
}

function sendToWindow(channel, content) {
  mainWindow.webContents.send(channel, content)
}

app.on('ready', () => {
  let appIds
  if (process.argv[2] === 'global') {
    appIds = [undefined]
  } else if (fs.existsSync(blockpartyDir)) {
    appIds = fs.readdirSync(blockpartyDir)
  } else {
    appIds = []
  }

  const ssbConfigs = appIds.map(appName => {
    const appDir = path.join(blockpartyDir, appName)
    const fileContents = fs.readFileSync(path.join(appDir, 'config'), 'utf8')
    let appConfig
    try {
      appConfig = JSON.parse(fileContents)
    } catch (err) {
      return console.log('could not parse config file')
    }
    // config merges the given config with the default boilerplate
    // it uses rc to find the app's config file but can't find ours,
    // because it's nested in the .blockparty directory
    appConfig.path = appDir
    const ssbConfig = appName ? injectConfig(appConfig) : injectConfig()
    const keys = ssbKeys.loadOrCreateSync(path.join(ssbConfig.path, 'secret'))
    ssbConfig.keys = keys
    ssbConfig.ownId = keys.id
    ssbConfig.appName = appName || 'global-scuttlebutt'

    // are a we pub admin?
    const pubFilePath = path.join(appDir, 'pub')
    if (fs.existsSync(pubFilePath)) {
      const pubConfig = JSON.parse(fs.readFileSync(pubFilePath))
      ssbConfig.pubConfig = pubConfig
    }

    return ssbConfig
  })

  const sbots = ssbConfigs.reduce((acc, config) => {
    const sbot = startSbot(config)
    acc[config.appName] = sbot
    return acc
  }, {})
  ssbConfigs.forEach(config => {
    config.manifest = sbots[config.appName].getManifest()
  })
  createWindow(ssbConfigs)

  ipcMain.on('create-network', async (event, {appName, apiToken}) => {
    createNetwork(appName, apiToken, blockpartyDir, mainWindow, (err, pubConnectionConfig) => {
      if (err) return console.log(err)
      event.sender.send('network-created', {appName, pubConnectionConfig})
    })
  })
})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

