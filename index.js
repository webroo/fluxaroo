'use strict';

var Dispatcher = require('./lib/dispatcher');
var utils = require('./lib/utils');

var dispatcher = new Dispatcher();

var Fluxaroo = {
  dispatcher: dispatcher,
  waitForStores: dispatcher.waitFor.bind(dispatcher),
  createStore: utils.createStore,
  createContainer: utils.createContainer
};

module.exports = Fluxaroo;
