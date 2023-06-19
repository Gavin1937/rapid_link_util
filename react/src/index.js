import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Routes,
  Route,
  HashRouter,
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.css';
import Main from './page.js';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <Routes>
      <Route exact path="/" element={ <Main /> } />
    </Routes>
  </HashRouter>
);

