import React from 'react';
import BussLocationSupplier from './components/BussLocationSupplier';
import 'normalize.css';

import "styles/base/_main.sass"  // Global styles
import "styles/base/_common.sass"  // Global styles

const App = () => (
  <div className='App'>
    <BussLocationSupplier/>
  </div>
);

export default App;
