/* eslint-disable quote-props */
'use strict'
const path = require('path')
const fs = require('fs')
const os = require('os')
const slugify = require('slugify')
const crypto = require('crypto')

const {app, BrowserWindow, ipcMain} = require('electron')
const startSbots = require('./server.js')
const ssbKeys = require('ssb-keys')
const config = require('ssb-config/inject')
const setUpNetworkLocally = require('./set-up-locally')
const installOnDigitalOcean = require('./install-on-digital-ocean')

const blockpartyDir = path.join(os.homedir(), '.blockparty')

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
    const ssbConfig = appName ? config(appName, appConfig) : config()
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

  ipcMain.on('create-network', (event, {appName, apiToken}) => {
    const slugifiedId = slugify(appName)
    const shsKey = crypto.randomBytes(32).toString('base64')
    const port = Math.floor(50000 + 15000 * Math.random())

    const appDir = setUpNetworkLocally(slugifiedId, shsKey, port, blockpartyDir)
    // also TODO: use same key for all, or not?
    const keys = ssbKeys.loadOrCreateSync(path.join(appDir, 'secret'))
    // TODO get these dynamically and let user choose
    installOnDigitalOcean({
      apiToken,
      name: slugifiedId,
      region: 'nyc3',
      size: 's-1vcpu-1gb',
      appId: shsKey,
      port,
      userKey: keys.id
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
