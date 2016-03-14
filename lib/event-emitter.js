'use strict';

/**
 * Basic event emitter class
 */
function EventEmitter() {
  this.events = {};
}

/**
 * Adds a listener callback
 * @param {String}   event    Event name
 * @param {Function} callback Callback function
 */
EventEmitter.prototype.addListener = function(event, callback) {
  this.events[event] = this.events[event] || [];
  this.events[event].push(callback);
};

/**
 * Removes a listener callback
 * @param  {String}   event    Event name
 * @param  {Function} callback Callback function
 */
EventEmitter.prototype.removeListener = function(event, callback) {
  if (event in this.events) {
    this.events[event].splice(this.events[event].indexOf(callback), 1);
  }
};

/**
 * Emits an event
 * @param  {String} event Event name
 */
EventEmitter.prototype.emit = function(event) {
  if (event in this.events) {
    for (var i = 0; i < this.events[event].length; i++) {
      this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
};

module.exports = EventEmitter;
