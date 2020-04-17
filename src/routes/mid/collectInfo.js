/**
 * @Author: francesco
 * @Date:   2020-04-16T20:17:53+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-04-16T23:12:04+02:00
 */

const crypto = require('crypto');

const collectInfo = (req, res, next) => {
  req.payload = {
    userIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userToken: {
      v: req.cookies.token || crypto.createHash('md5').update(JSON.stringify([Math.random()*154875211, Date.now()])).digest('base64').replace(/[\+\/\=]/g, ""),
      new: (req.cookies.token === null || req.cookies.token === undefined)
    }
  }

  if (req.cookies.token === null || req.cookies.token === undefined)
    res.cookie('token', req.payload.userToken.v)

  next();
}

module.exports = collectInfo;
