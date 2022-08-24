import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Annotator from './Annotator';
import ProjectPage from './ProjectPage'
import {getProject, getDataDir} from './path';
import OverviewPage from "./OverviewPage";

ReactDOM.render(
  <React.StrictMode>
  {
      getProject() === undefined ? <OverviewPage /> :
          getDataDir() === undefined ? <ProjectPage /> : <Annotator />
  }
  </React.StrictMode>,
  document.getElementById('root')
);

