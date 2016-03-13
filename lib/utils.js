'use strict';

var React = require('react');
var EventEmitter = require('./event-emitter.js');

/**
 * Basic extend function to merge objects
 * @param  {Object} destination Destination object for all source objects to merge into
 * @param  {Object} ...sources  Source objects to merge
 * @return {Object}
 */
function extend(destination) {
  var sources = Array.prototype.slice.call(arguments, 1);
  sources.forEach(function(source) {
    for (var prop in source) {
      if (source.hasOwnProperty(prop)) {
        destination[prop] = source[prop];
      }
    }
  });
  return destination;
}

/**
 * Creates and returns a new store. The store is responsible for holding and mutating state.
 * @param  {Object} options                Options
 * @param  {*}      options.initialState   Value of the initial store state, can be any type
 * @param  {Object} options.actionHandlers Map of functions to handle actions
 * @return {Object}                        New store
 */
function createStore(options) {
  var dispatcher = this.dispatcher;

  if (!options || options.initialState === undefined) {
    throw new Error('Fluxaroo: An initialState object must be defined when creating a store');
  }

  function Store(options) {
    // Store the action handlers on the instance so they can be accessed for testing
    this.actionHandlers = options.actionHandlers;

    // Read-only access to the state
    this.getState = function() {
      return options.initialState;
    };

    // The storeKey can be used in Dispatcher.waitFor()
    this.storeKey = dispatcher.register(function(action) {
      // By the time the action reaches here the dispatcher will have checked it has a valid type
      if (options.actionHandlers[action.type]) {
        options.initialState = options.actionHandlers[action.type](options.initialState, action);
        this.emit('change');
      }
    }.bind(this));
  }

  Store.prototype = new EventEmitter();

  return new Store(options);
}

/**
 * Wraps an object map of action functions in new functions that automatically call dispatch()
 * @param  {Object} dispatcher Instance of the Dispatcher
 * @param  {Object} actions    Map of action functions
 * @return {Object}            Map of wrapped action functions
 */
function wrapActionProps(dispatcher, actions) {
  var wrappedActionProps = {};
  var actionFunc;

  // Wrap each action function and automatically call dispatch() with the result of the action
  for (var actionName in actions) {
    actionFunc = actions[actionName];
    wrappedActionProps[actionName] = function(actionFunc) {
      var args = Array.prototype.slice.call(arguments, 1);
      dispatcher.dispatch(actionFunc.apply(actions, args));
    }.bind(this, actionFunc); // Use bind to capture the value of actionFunc in a closure
  }

  return wrappedActionProps;
}

/**
 * Creates a wrapper component that automatically injects store values and action handlers into
 * the props of the given component.
 * @param  {*} component                     The component into which store values and actions are injected
 * @param  {Object} options                  Options
 * @param  {Object} options.storeDepedencies Array of store instances that the container depends on
 * @param  {Object} options.storeProps       Function that returns an object map of store values to inject
 * @param  {Object} options.actionProps      Function that returns an object map of action handlers to inject
 * @return {Object}                          React component class
 */
function createContainer(component, options) {
  var dispatcher = this.dispatcher;

  if (options.storeProps && !Array.isArray(options.storeDepedencies)) {
    throw new Error('Fluxaroo: An array of storeDepedencies must be defined when creating a container with storeProps');
  }

  return React.createClass({
    // Returns on object representing the state by merging the result of storeProps() and actionProps()
    getState: function() {
      var state = {};

      if (options.storeProps) {
        // Copy the result of storeProps() onto the new state object
        extend(state, options.storeProps(this.props));
      }

      if (options.actionProps) {
        // Copy the result of actionProps() onto the new state object
        extend(state, wrapActionProps(dispatcher, options.actionProps(this.props)));
      }

      return state;
    },

    getInitialState: function() {
      return this.getState();
    },

    // Triggered whenever a store action handler finishes
    onStoreChange: function() {
      this.setState(this.getState());
    },

    componentDidMount: function() {
      if (options.storeDepedencies) {
        options.storeDepedencies.forEach(function(store) {
          store.addListener('change', this.onStoreChange);
        }.bind(this));
      }
    },

    componentWillUnmount: function() {
      if (options.storeDepedencies) {
        options.storeDepedencies.forEach(function(store) {
          store.removeListener('change', this.onStoreChange);
        }.bind(this));
      }
    },

    render: function() {
      return React.createElement(component, extend({}, this.state, this.props));
    }
  });
}

module.exports = {
  createStore: createStore,
  createContainer: createContainer
};
