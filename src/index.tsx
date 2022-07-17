import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {getProject, getDataDir} from './path';

ReactDOM.render(
  <React.StrictMode>
  {
      getProject() === undefined ? <div style={{color: "white"}}>Missing project path</div> :
          getDataDir() === undefined ? <div style={{color: "white"}}>Missing data path</div> : <App />
  }
  </React.StrictMode>,
  document.getElementById('root')
);

