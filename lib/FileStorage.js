const fs = require('fs');
const path = require('path');

class FileStorage {
  constructor(path) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    this.path = path;

    return this;
  }
  get(key) {
    const filePath = path.join(this.path, key);

    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(JSON.parse(result));
      });
    });
  }
  put(key, value) {
    const filePath = path.join(this.path, key);

    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      stream.on('error', reject);
      stream.end(JSON.stringify(value), resolve);
    });
  }
  del(key) {
    const filePath = path.join(this.path, key);

    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (error) => {
        if (error) {
          return reject(error);
        }

        return resolve(true);
      });
    });
  }
}
module.exports = FileStorage;
