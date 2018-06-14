exports.condition = {
  pathname: '/test',
};

function handler() {
  return Promise.resolve('????');
}
exports.handler = handler;
