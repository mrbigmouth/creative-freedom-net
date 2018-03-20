const apiHandlerList = [];

function resetAPIHandler(sourcePath) {
  const oldIndex = apiHandlerList.findIndex((apiHandler) => {
    return apiHandler.sourcePath === sourcePath;
  });
  if (oldIndex !== -1) {
    console.log(`api handler[${sourcePath}] is reset!`);
    apiHandlerList.splice(oldIndex, 1);
    delete require.cache[sourcePath];
  }
}

function prepareAPIHandler(sourcePath) {
  resetAPIHandler(sourcePath);
  try {
    /* eslint-disable global-require, import/no-dynamic-require */
    const fileExports = require(sourcePath);
    /* eslint-enable global-require, import/no-dynamic-require */
    apiHandlerList.push({
      sourcePath,
      condition: fileExports.condition,
      handler: fileExports.handler,
    });
    console.log(`api handler[${sourcePath}] is ready!`);
  }
  catch (e) {
    console.error(`api handler[${sourcePath}] has error:`);
    console.error(e);
  }
}

exports.apiHandlerList = apiHandlerList;
exports.resetAPIHandler = resetAPIHandler;
exports.prepareAPIHandler = prepareAPIHandler;
