import React from 'react';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';
import App from './app';
import BussLocationSupplier from './components/BussLocationSupplier';

const Routes = () => (
  <Router>
    <div>
      <Route exact path="/" component={App}/>
      <Route path="/sample" component={BussLocationSupplier}/>
    </div>
  </Router>
);

export default Routes;
