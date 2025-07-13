// /src/modules/misc/misc.controller.js
const config = require('../../core/config/config');

const getFrontendConfig = (req, res) => {
  res.json({
    cloudflareSiteKey: config.cloudflare.siteKey,
  });
};

module.exports = {
  getFrontendConfig,
};