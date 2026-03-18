const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Cache Chrome inside the project directory so Render's build cache includes it
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
