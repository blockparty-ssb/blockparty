'use strict'
const request = require('request-promise-native')

module.exports = async function (apiToken) {
  const opts = {
    method: 'GET',
    url: 'https://api.digitalocean.com/v2/sizes',
    auth: { bearer: apiToken },
    json: true
  }
  try {
    const res = await request(opts)
    return res.sizes
  } catch (err) {
    if (err.statusCode === 401) {
      throw new Error('wrongToken')
    } else if (err.name === 'RequestError') {
      throw new Error('noInternet')
    } else throw new Error(err.message)
  }
}
