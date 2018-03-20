/* eslint-disable import/no-extraneous-dependencies, no-console */
const path = require('path');
const watch = require('watch');
const childProcess = require('child_process');
const { CLIEngine: EsLintCLIEngine } = require('eslint');
const config = require('./config');
const start = require('./server/start');
const { prepareAPIHandler, resetAPIHandler } = require('./server/prepareAPIHandler');

const serverPath = path.join(config.ROOT_PATH, 'server');
const watchOptions = {
  filter(fileStaus) {
    return (
      typeof fileStaus === 'string' &&
      fileStaus.slice(-3) === '.js'
    );
  },
};
const esLintCli = new EsLintCLIEngine();
const esLintFormatter = esLintCli.getFormatter();
function esLinter(filePath) {
  const report = esLintCli.executeOnFiles([filePath]);
  console.log(esLintFormatter(report.results));
}
watch.createMonitor(serverPath, watchOptions, (monitor) => {
  monitor.on('created', esLinter);
  monitor.on('changed', esLinter);
});

const apiPath = path.join(serverPath, 'api');
watch.createMonitor(apiPath, watchOptions, (monitor) => {
  monitor.on('created', prepareAPIHandler);
  monitor.on('changed', prepareAPIHandler);
  monitor.on('removed', resetAPIHandler);
});

// webpack
const webpackPath = require.resolve('webpack/bin/webpack.js');
childProcess.fork(webpackPath, ['--config', 'webpack.development.config.js']);

// start server
start(config);
