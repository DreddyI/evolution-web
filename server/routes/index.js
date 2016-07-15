var router = require('express').Router();
var path = require('path');

module.exports = (app, passport) => {
// Rest API
//require(path.join(__dirname, './', 'todos'))(router);
//require(path.join(__dirname, './', 'users'))(router);

// Homepage/Client
  router.get('/', function (req, res, next) {
    res.send("ok");
  });

// Homepage/Client
  router.get('/state', function (req, res, next) {
    const state = app.get('store').getState().toJS();

    state.connections = Object.keys(state.connections).reduce((result, key) => {
      result[key] = '#socket#';
      return result;
    }, {});

    const format = (str) => `<pre>${str}</pre>`;
    res.send(format(JSON.stringify(state, null, '  ')));
  });

  // set authentication routes
  //require('./authentication.js')(app, passport);

  // set other routes
  app.use('/api', router);
};