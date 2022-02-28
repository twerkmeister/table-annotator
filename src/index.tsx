import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {getDataDir} from './path';

ReactDOM.render(
  <React.StrictMode>
  {
      getDataDir() === undefined ?
          <div>Missing data path</div> : <App />
  }
  </React.StrictMode>,
  document.getElementById('root')
);

