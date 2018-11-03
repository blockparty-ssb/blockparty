'use strict'
const path = require('path')
const fs = require('fs')
const {app, BrowserWindow} = require('electron')
const startSbots = require('./server.js')
const ssbKeys = require('ssb-keys')
const config = require('ssb-config/inject')

let mainWindow

function createWindow (ssbConfigs) {
  mainWindow = new BrowserWindow({width: 800, height: 600})

  mainWindow.loadFile('index.html')

  mainWindow.webContents.openDevTools()
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.send('ssb-configs', ssbConfigs)
  })
}

app.on('ready', () => {
  let appIds
  if (process.argv[2] === 'global') {
    appIds = [undefined]
  } else {
    appIds = fs.readFileSync(path.join(process.env.HOME, '.blockparty'), 'utf-8')
      .trim()
      .split('\n')
  }

  const ssbConfigs = appIds.map(appName => {
    const ssbConfig = appName ? config(appName) : config()
    const keys = ssbKeys.loadOrCreateSync(path.join(ssbConfig.path, 'secret'))
    ssbConfig.keys = keys
    ssbConfig.appName = appName || 'global-scuttlebutt'
    return ssbConfig
  })

  const sbots = startSbots(ssbConfigs)
  ssbConfigs.forEach(config => {
    config.manifest = sbots[config.appName].getManifest()
  })
  createWindow(ssbConfigs)
})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
