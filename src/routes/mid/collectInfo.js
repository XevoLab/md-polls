/**
 * @Author: francesco
 * @Date:   2020-04-16T20:17:53+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-05-20T11:56:16+02:00
 */

const crypto = require('crypto');

const collectInfo = (req, res, next) => {
  req.payload = {
    userIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userToken: {
      v: req.cookies.t || crypto.createHash('md5').update(JSON.stringify([Math.random()*154875211, Date.now()])).digest('base64').replace(/[\+\/\=]/g, ""),
      new: (req.cookies.t === null || req.cookies.t === undefined)
    }
  }

  if (req.cookies.t === null || req.cookies.t === undefined)
    res.cookie('t', req.payload.userToken.v, {expires: new Date(Date.now() + 31536000), httpOnly: true, sameSite: 'Lax'})

  next();
}

module.exports = collectInfo;
