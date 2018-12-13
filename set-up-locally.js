'use strict'
const path = require('path')
const fs = require('fs')

function setUpAppDir(appName, blockpartyDir, networkConfig) {
  const appDir = makeAppDirectory(appName)
  fs.writeFileSync(path.join(appDir, 'config'), JSON.stringify(networkConfig, null, 4))
  return appDir

  function makeAppDirectory (appId) {
  // TODO check and handle if .blockparty is a file, not a directory
    if (!fs.existsSync(blockpartyDir)) {
    // TODO error handling
      fs.mkdirSync(blockpartyDir)
    }
    try {
      const appDirectory = path.join(blockpartyDir, appId)
      fs.mkdirSync(appDirectory)
      return appDirectory
    } catch (err) {
      console.log(err)
    }
  }
}

function persistPubConfig(pubConfig, appDir) {
  fs.writeFileSync(path.join(appDir, 'pub'), JSON.stringify(pubConfig, null, 4))
  console.log('wrote pub file')
}

module.exports = {setUpAppDir, persistPubConfig}
