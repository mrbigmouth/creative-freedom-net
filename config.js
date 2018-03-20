const path = require('path');

const ROOT_PATH = __dirname;
const DATA_PATH = path.join(ROOT_PATH, 'data');
const TOR_DATA_PATH = path.join(DATA_PATH, 'tor');
const IDENTITY_PATH = path.join(DATA_PATH, 'identity.key');
const ADMIN_PORT = '5555';
const VIEW_PORT = '';

module.exports = {
  ROOT_PATH,
  DATA_PATH,
  TOR_DATA_PATH,
  IDENTITY_PATH,
  ADMIN_PORT,
  VIEW_PORT,
  identity: null,
};
