const url = require('url');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const connect = require('connect');
const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const walk = require('walk');
const clientRouteList = require('../client/source/routes.js');
const { prepareAPIHandler, apiHandlerList } = require('./prepareAPIHandler');

function startHTTPServer(config) {
  const server = connect();
  // response html
  server.use((req, res, next) => {
    const isRequestClientPage = clientRouteList.some((route) => {
      return route.path === req.url;
    });
    if (isRequestClientPage) {
      const indexPath = path.join(config.ROOT_PATH, 'client', 'dest', 'index.html');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      res.end(indexContent);
    }
    else {
      next();
    }
  });
  // prepare for api
  walk.walkSync(path.join(config.ROOT_PATH, 'server', 'api'), {
    listeners: {
      file(rootPath, file, next) {
        prepareAPIHandler(path.join(rootPath, file.name));
        next();
      },
    },
  });
  server.use(bodyParser.json());
  server.use(bodyParser.urlencoded({
    extended: true,
  }));
  // response for api
  server.use((req, res, next) => {
    const { method, body } = req;
    const parsedUrl = url.parse(req.url);
    const { pathname } = parsedUrl;
    const query = querystring.parse(parsedUrl.query);
    const params = query.params ? JSON.parse(query.params) : null;
    const condition = {
      method,
      parsedUrl,
      pathname,
      query,
      params,
      body,
    };

    const apiHandler = apiHandlerList.find((apiHandler) => {
      const apiHandlerCondition = apiHandler.condition;
      if (apiHandlerCondition) {
        if (typeof apiHandlerCondition === 'function') {
          return apiHandlerCondition(condition);
        }

        return Object.keys(apiHandlerCondition).every((key) => {
          const conditionRule = apiHandlerCondition[key];
          const conditionValue = condition[key];

          if (typeof conditionRule.test === 'function') {
            return conditionRule.test(conditionValue);
          }

          return conditionRule === conditionValue;
        });
      }

      return false;
    });
    if (apiHandler) {
      res.setHeader('Content-Type', 'application/json');
      apiHandler.handler(condition)
        .then((result) => {
          res.statusCode = 200;
          const resultMessage = JSON.stringify(result);
          res.end(resultMessage);
        })
        .catch((e) => {
          res.statusCode = 500;
          const errorMessage = JSON.stringify(e);
          res.end(errorMessage);
        });

      return true;
    }

    return next();
  });
  // response for static file
  server.use(serveStatic(path.join(config.ROOT_PATH, 'client', 'dest')));

  // Listen
  server.listen(config.ADMIN_PORT);
  console.log(`server listening ${config.ADMIN_PORT}...`);
}

module.exports = startHTTPServer;
