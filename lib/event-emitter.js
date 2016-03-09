'use strict';

function EventEmitter() {
  this.events = {};
}

EventEmitter.prototype.addListener = function(event, callback) {
  this.events[event] = this.events[event] || [];
  this.events[event].push(callback);
};

EventEmitter.prototype.removeListener = function(event, callback) {
  if (event in this.events) {
    this.events[event].splice(this.events[event].indexOf(callback), 1);
  }
};

EventEmitter.prototype.emit = function(event) {
  if (event in this.events) {
    for (var i = 0; i < this.events[event].length; i++) {
      this.events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
};

module.exports = EventEmitter;
