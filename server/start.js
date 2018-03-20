const prepareDataFolder = require('./prepareDataFolder');
const startHTTPServer = require('./startHTTPServer');

function start(config) {
  prepareDataFolder(config);
  startHTTPServer(config);
}

module.exports = start;
