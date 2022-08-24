import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Annotator from './Annotator';
import ProjectPage from './ProjectPage'
import {getProject, getDataDir} from './path';

ReactDOM.render(
  <React.StrictMode>
  {
      getProject() === undefined ? <div style={{color: "white"}}>Missing project path</div> :
          getDataDir() === undefined ? <ProjectPage /> : <Annotator />
  }
  </React.StrictMode>,
  document.getElementById('root')
);

