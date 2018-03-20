const fs = require('fs');

module.exports = function prepareDataFolder({ DATA_PATH }) {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH);
  }
};
