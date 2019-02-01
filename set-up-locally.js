'use strict'
const path = require('path')
const fs = require('fs')

function setUpAppDir(appId, blockpartyDir, networkConfig) {
  const appDir = makeAppDirectory(appId)
  try {
    fs.writeFileSync(path.join(appDir, 'config'), JSON.stringify(networkConfig, null, 4))
  } catch (err) {
    throw new Error('Could not write config file: ' + err.message)
  }
  return appDir

  function makeAppDirectory (appId) {
    if (!fs.existsSync(blockpartyDir)) {
      try {
        fs.mkdirSync(blockpartyDir)
      } catch (err) {
        throw new Error('Could not create blockparty directory: ' + err.message)
      }
    } else {
      const stat = fs.statSync(blockpartyDir)
      if (stat.isFile()) throw new Error('blockparty directory path already exists as a file')
    }
    const appDirectory = path.join(blockpartyDir, appId)
    try {
      fs.mkdirSync(appDirectory)
    } catch (err) {
      throw new Error('Could not create app directory: ' + err.message)
    }
    return appDirectory
  }
}

function persistPubConfig(pubConfig, appDir) {
  fs.writeFileSync(path.join(appDir, 'pub'), JSON.stringify(pubConfig, null, 4))
  console.log('wrote pub file')
}

module.exports = {setUpAppDir, persistPubConfig}
