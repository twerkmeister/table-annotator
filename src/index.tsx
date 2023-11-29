import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Annotator from './Annotator';
import ProjectPage from './ProjectPage'
import {getProject, getDataDir, getProjectBucket} from './path';
import BucketPage from "./BucketPage";
import OverviewPage from "./OverviewPage";

ReactDOM.render(
  <React.StrictMode>
  {
      getProjectBucket() === undefined ? <OverviewPage /> :
        getProject() === undefined ? <BucketPage /> :
          getDataDir() === undefined ? <ProjectPage /> : <Annotator />
  }
  </React.StrictMode>,
  document.getElementById('root')
);

