'use strict';

// This is a copy of the original FB Flux dispatcher with a few tweaks

var _prefix = 'STORE_';

function Dispatcher() {
  this._callbacks = {};
  this._isDispatching = false;
  this._isHandled = {};
  this._isPending = {};
  this._lastID = 1;
  this._pendingPayload = null;
}

/**
 * Registers a callback to be invoked with every dispatched payload. Returns
 * a token that can be used with `waitFor()`.
 */
Dispatcher.prototype.register = function(callback) {
  var id = _prefix + this._lastID++;
  this._callbacks[id] = callback;
  return id;
};

/**
 * Removes a callback based on its token.
 */
Dispatcher.prototype.unregister = function(id) {
  delete this._callbacks[id];
};

/**
 * Waits for the callbacks specified to be invoked before continuing execution
 * of the current callback. This method should only be used by a callback in
 * response to a dispatched payload.
 */
Dispatcher.prototype.waitFor = function(ids) {
  for (var ii = 0; ii < ids.length; ii++) {
    var id = ids[ii].storeKey;
    if (this._isPending[id]) {
      continue;
    }
    this._invokeCallback(id);
  }
};

/**
 * Dispatches a payload to all registered callbacks.
 */
Dispatcher.prototype.dispatch = function(payload) {
  // If the action has returned a function instead of an object then we treat it as an async action.
  // We give it an instance of the dispatcher so it can manually dispatch actions.
  if (typeof payload === 'function') {
    payload(this.dispatch.bind(this));
  } else {
    if (!payload || !payload.type) {
      throw new Error('Actions must return an object with a \'type\' property');
    }
    this._startDispatching(payload);
    try {
      for (var id in this._callbacks) {
        if (this._isPending[id]) {
          continue;
        }
        this._invokeCallback(id);
      }
    } finally {
      this._stopDispatching();
    }
  }
};

/**
 * Is this Dispatcher currently dispatching.
 */
Dispatcher.prototype.isDispatching = function() {
  return this._isDispatching;
};

/**
 * Call the callback stored with the given id. Also do some internal
 * bookkeeping.
 *
 * @internal
 */
Dispatcher.prototype._invokeCallback = function(id) {
  this._isPending[id] = true;
  this._callbacks[id](this._pendingPayload);
  this._isHandled[id] = true;
};

/**
 * Set up bookkeeping needed when dispatching.
 *
 * @internal
 */
Dispatcher.prototype._startDispatching = function(payload) {
  for (var id in this._callbacks) {
    this._isPending[id] = false;
    this._isHandled[id] = false;
  }
  this._pendingPayload = payload;
  this._isDispatching = true;
};

/**
 * Clear bookkeeping used for dispatching.
 *
 * @internal
 */
Dispatcher.prototype._stopDispatching = function() {
  delete this._pendingPayload;
  this._isDispatching = false;
};

module.exports = Dispatcher;
