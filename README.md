# Fluxaroo

Flux implementation using functional side-effect free actions and stores.

*NOT FOR PRODUCTION USE!*

*I wrote this as a way to learn about the Flux architecture. It's used in a few personal projects but is otherwise untested and unmaintained.*

## Usage

There are three main parts to Fluxaroo: actions, stores, and containers. These form the basic building blocks of the Flux architecture. You can learn more about them in the [official docs](https://facebook.github.io/flux/docs/overview.html).

### Actions

Actions describe changes that occur to the state of your app. In Fluxaroo actions are simply functions that return an object. The object must contain a `type` property. It can also contain any number of additional properties that describe how to change the state. Since action functions just return plain objects they can be easily tested. Dispatching actions is handled automatically behind the scenes by Fluxaroo when you [create containers](#containers).

The `product-actions.js` module:

```js
const actions = {
  // Actions are simply functions that return an object, making testing them easy
  removeProduct(id) {
    return {
      type: 'REMOVE_PRODUCT', // Actions must contain a type string
      id: id // You can add any other data to describe the action
    };
  },

  addProduct(name, price) {
    return {
      type: 'ADD_PRODUCT',
      id: Date.now(),
      name: name,
      price: price
    };
  }
};

export default actions;
```

### Stores

Stores hold data that represent the state of the your app. You can have as many stores in your app as you want. Stores respond to actions by modifying their internal state, then notify view components of the changes. In Fluxaroo you provide each store with an initial state (which can be any type of object), and a collection of action handlers which are called when an action is dispatched. The action handlers are simply functions that receive the complete state of the store and the action object, and expect the complete state of the store to be returned after it's been modified. This allows them to be easily tested.

The `product-store.js` module:

```js
import Fluxaroo from 'fluxaroo';

const ProductStore = Fluxaroo.createStore({
  // Stores must be given an initial state, which can be any data type
  initialState: {
    products: [
      {
        id: '0',
        name: 'Desk',
        price: 90
      },
      {
        id: '1',
        name: 'Chair',
        price: 25
      }
    ]
  },

  // Action handlers will be automatically called when actions are dispatched
  actionHandlers: {
    // Handlers must have the same name as the type property in the action object.
    // They will receive the complete state of the store and the action object,
    // they must return the complete state - this makes testing them easy.
    'REMOVE_PRODUCT'(state, action) {
      // Modify the state and return it
      state.products = state.products.filter(product => product.id !== action.id);
      return state;
    },
    'ADD_PRODUCT'(state, action) {
      state.products.push({
        id: action.id,
        name: action.name,
        price: action.price
      });
      return state;
    }
  }
});

export default ProductStore;
```

### Containers

Containers wrap an existing component and allow you to inject state data and actions into the `props` object. Behind the scenes they create an additional lightweight stateful component that simply injects props into the wrapped component and renders it. They don't insert any extra elements into the DOM. Using containers allows you to keep your actual components stateless by abstracting away the state management normally required to trigger renders (eg: calling `setState()`). This makes testing your components easier.

The `product-list.js` module:

```js
import Fluxaroo from 'fluxaroo';
import ProductStore from './product-store.js';
import ProductActions from './product-actions.js';

// This is our actual component that gets rendered on the page. The container we
// create below will inject state data and actions into the props object.
function ProductList(props) {
  return (
    <ul>
      {props.products.map(product => (
        <li key={product.id}>
          {product.name}
          <button onClick={props.removeProduct.bind(product.id)}>Remove</button>
       	</li>
      ))}
    </ul>
  );
}

// Wrap the component in a container and specify the injected state/actions
const ProductListContainer = Fluxaroo.createContainer(ProductList, {
  // A list of stores to listen to changes from. If you're injecting state from a
  // store then you must include it here to receive updates from it.
  storeDepedencies: [ProductStore],

  // Return a map of props to inject into the component from the stores
  storeProps: () => {
    return {
      products: ProductStore.getState().products
    };
  },

  // Return a map of action handlers to inject, these will be automatically wrapped
  // so they dispatch into the Fluxaroo system
  actionProps: () => {
    return {
      removeProduct: ProductActions.removeProduct
    };
  }
});

// We want to export the container, not the original component
export default ProductListContainer;

```

### Using containers

Containers can be used like any other React component. They will pass through any props you set on them.

The `app.js` module, acting as the entry point to the app:

```js
import ReactDOM from 'react-dom';
import ProductList from './product-list';

ReactDOM.render(<ProductList/>, document.getElementById('react-app'));
```

## Advanced usage

### Coordinating store changes

Sometimes an action will require more than one store to update it's state. In this case you might want a particular store to finish before starting another. You can coordinate this by using `Fluxaroo.waitForStores()`. Waiting for other stores is a core concept of the Flux architecture and is explained in more detail [here](https://facebook.github.io/react/blog/2014/07/30/flux-actions-and-the-dispatcher.html#why-we-need-a-dispatcher).

```js
const ProductStore = Fluxaroo.createStore({
  initialState: {
    products: [ /* etc... */ ]
  },
  actionHandlers: {
    'REMOVE_PRODUCT'(state, action) {
      // waitForStores() takes an array of store references and ensures their action handlers
      // are executed before returning to continue this one
      Fluxaroo.waitForStores([SelectedProductsStore]);

      // Remove the product from this store
      state.products = state.products.filter(product => product.id !== action.id);
      return state;
    }
  }
});

const SelectedProductsStore = Fluxaroo.createStore({
  initialState: {
    selectedProducts: [ /* etc... */ ]
  },
  actionHandlers: {
    'REMOVE_PRODUCT'(state, action) {
      // Remove the product from this store
      state.selectedProducts = state.products.filter(product => product.id !== action.id);
      return state;
    }
  }
});
```

### Loading data with async actions

At some point you're likely to want to fetch data from an external source, and this means dealing with asynchronous requests. The standard Flux practice is to handle this in Actions, not Stores. This keeps the action handlers in your stores synchronous, which is a lot easier to test and debug.

Async actions that deal with fetch requests are generally designed as composite actions. This means they should dispatch a sequence of actions that inform the app of the fetch progress.

In order to tell Fluxaroo you want to use an async action rather than a regular action you must return a *function* from the action method, not an object. If Fluxaroo receives a function then it automatically assumes you're going to write an async action and calls your returned function with the `dispatch()` method as the first argument. You can then use `dispatch()` to trigger your own actions.

The following example uses the new [Fetch API](https://developer.mozilla.org/en/docs/Web/API/Fetch_API), which you can use with the [fetch polyfill](https://github.com/github/fetch).

```js
const actions = {
  addProduct(name, price) {
    // If you want to create an async action then return a function, not an object.
    // Fluxaroo will automatically call the method and pass the dispatch() function in,
    // allowing you manually dispatch further actions.
    return dispatch => {
      const id = Date.now();

      // Dispatch an action to add the product immediately, if the fetch fails we will
      // have to dispatch further actions to tell the user something went wrong
      dispatch({
        type: 'ADD_PRODUCT',
        id: id,
        name: name,
        price: price
      });

      // Save the new product
      fetch('/product', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: id,
          name: name,
          price: price
        })
      })
      .then(response => {
        // If it was successful then dispatch a success action
        dispatch({
          type: 'ADD_PRODUCT_SUCCESS',
          id: newId
        });
      })
      .catch(error => {
        // If it failed then dispatch a fail action, the stores and UI will have to take
        // appropriate action to tell the user something went wrong
        dispatch({
          type: 'ADD_PRODUCT_FAIL',
          id: newId
        });
      });
    };
  }
}
```
