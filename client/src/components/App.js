import React, { useEffect } from 'react';
import { Header, BookList, Player } from "./_components.js";
import {Auth, Home } from "./_components"
import axios from 'axios'
import "./style/App.css"

import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import { useSelector } from 'react-redux';

function App() {
 console.log('%c APP', 'color: orange')
  return (
    <Router>
       <div className="app">
          <Route exact path="/" component={Auth}/>
          <Route exact path="/app" component={Home}/>
      </div>
    </Router>
   
  );
}

export default App;
