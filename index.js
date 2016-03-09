'use strict';

var Dispatcher = require('./lib/dispatcher');
var EventEmitter = require('./lib/event');
var utils = require('./lib/utils');

var Fluxaroo = {
  Dispatcher: Dispatcher,
  EventEmitter: EventEmitter,
  utils: utils
};

module.exports = Fluxaroo;
