'use strict';

var Dispatcher = require('./lib/dispatcher');
var utils = require('./lib/utils');

var Fluxaroo = {
  dispatcher: new Dispatcher(),
  createStore: utils.createStore,
  createContainer: utils.createContainer
};

module.exports = Fluxaroo;
