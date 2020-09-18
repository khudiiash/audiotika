import React, { useEffect } from 'react';
import { Header, BookList, Player } from "./_components.js";
import {Auth, Home } from "./_components"
import axios from 'axios'
import "./style/App.css"

import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';
import { useSelector } from 'react-redux';

function App() {
 const user = useSelector(state => state.user )
  return (
    <Router>
       <div className="app">
          <Route exact path="/" component={ user ? Home : Auth }/>
      </div>
    </Router>
   
  );
}

export default App;
