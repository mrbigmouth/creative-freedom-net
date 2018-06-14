/* eslint no-bitwise: "off" */
// https://github.com/kadtools/kad/blob/master/lib/utils.js
// http://blog.csdn.net/tsingmei/article/details/2924368
const crypto = require('crypto');

exports.constants = {
  // Degree of parallelism
  ALPHA: 3,
  // Number of bits for nodeID creation
  B: 224,
  // Number of contacts held in a bucket
  K: 20,
  // Interval for performing router refresh
  T_REFRESH: 3600000,
};

exports.getDistance = function getDistance(key1, key2) {
  const buffer1 = Buffer.from(key1, 'hex');
  const buffer2 = Buffer.from(key2, 'hex');
  const result = Buffer.alloc(exports.constants.B / 8);

  return result.map((b, index) => {
    return buffer1[index] ^ buffer2[index];
  });
};

exports.compareKeyDistance = function compareKeyDistance(fromKey, key1, key2) {
  const distance1 = exports.getDistance(fromKey, key1);
  const distance2 = exports.getDistance(fromKey, key2);

  for (let index = 0; index < distance1.length; index += 1) {
    const bit1 = distance1[index];
    const bit2 = distance2[index];
    if (bit1 !== bit2) {
      return bit1 < bit2 ? -1 : 1;
    }
  }

  return 0;
};

exports.getBucketIndex = function getBucketIndex(referenceKey, foreignKey) {
  let bucketIndex = exports.constants.B;
  exports.getDistance(referenceKey, foreignKey).some((byteValue) => {
    if (byteValue === 0) {
      bucketIndex -= 8;

      return false;
    }
    for (let i = 0; i < 8; i += 1) {
      if (byteValue & (0x80 >> i)) {
        bucketIndex -= 1;

        return true;
      }
      bucketIndex -= 1;
    }

    return false;
  });

  return bucketIndex;
};

exports.getRandomKey = function getRandomKey() {
  return crypto.randomBytes(exports.constants.B / 8).toString('hex');
};
