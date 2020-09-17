import React, { useEffect } from 'react';
import { Header, BookList, Player } from "./_components.js";
import {Welcome, Home } from "./_components"
import "./style/App.css"

import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

function App() {

  return (
    <Router>
       <div className="app">
          <Route exact path="/" component={Welcome}/>
          <Route exact path="/app" component={Home}/>
      </div>
    </Router>
   
  );
}

export default App;
