const request = require('../request');

module.exports = {
  request(contact, data) {
    const url = 'http://' + contact.address[0] + ':' + contact.address[1];

    return request({
      method: 'post',
      responseType: 'json',
      url,
      data,
    });
  },
};
