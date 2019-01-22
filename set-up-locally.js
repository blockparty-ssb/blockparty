'use strict'
const path = require('path')
const fs = require('fs')

function setUpAppDir(appName, blockpartyDir, networkConfig, cb) {
  const appDir = makeAppDirectory(appName)
  try {
    fs.writeFileSync(path.join(appDir, 'config'), JSON.stringify(networkConfig, null, 4))
  } catch (err) {
    cb(new Error('Could not write config file: ' + err.message))
  }
  return appDir

  function makeAppDirectory (appId) {
    if (!fs.existsSync(blockpartyDir)) {
      try {
        fs.mkdirSync(blockpartyDir)
      } catch (err) {
        cb(new Error('Could not create blockparty directory: ' + err.message))
        return
      }
    } else {
      const stat = fs.statSync(blockpartyDir)
      if (stat.isFile()) return cb(new Error('blockparty directory path already exists as a file'))
    }
    const appDirectory = path.join(blockpartyDir, appId)
    try {
      fs.mkdirSync(appDirectory)
    } catch (err) {
      cb(new Error('Could not create app directory: ' + err.message))
      return
    }
    return appDirectory
  }
}

function persistPubConfig(pubConfig, appDir) {
  fs.writeFileSync(path.join(appDir, 'pub'), JSON.stringify(pubConfig, null, 4))
  console.log('wrote pub file')
}

module.exports = {setUpAppDir, persistPubConfig}
