'use strict';

var React = require('react');
var EventEmitter = require('./event.js');

function createStore(dispatcher, options) {
  function Store(options) {
    this.actionHandlers = options.actionHandlers;

    this.getState = function() {
      return options.initialState;
    };

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

function wrapActionProps(dispatcher, actions) {
  var wrappedActionProps = {};
  var actionFunc;

  // Wrap each function in another one that automatically calls dispatch() on the given args
  for (var actionName in actions) {
    actionFunc = actions[actionName];
    wrappedActionProps[actionName] = function(actionFunc) {
      var args = Array.prototype.slice.call(arguments, 1);
      dispatcher.dispatch(actionFunc.apply(actions, args));
    }.bind(this, actionFunc);
  }

  return wrappedActionProps;
}

function createContainer(component, options) {
  return React.createClass({
    getState: function() {
      // TODO throw error if actionDispatcher isn't given
      // TODO throw error if dependentStores isn't given
      return Object.assign(
        {},
        options.storeProps && options.storeProps(this.props),
        options.actionProps && wrapActionProps(options.actionDispatcher, options.actionProps(this.props))
      );
    },

    getInitialState: function() {
      return this.getState();
    },

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
      return React.createElement(component, Object.assign({}, this.state, this.props));
    }
  });
}

module.exports = {
  createStore: createStore,
  createContainer: createContainer
};
