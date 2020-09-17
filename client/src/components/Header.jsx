import React from 'react';
import {Search, User } from './_components';
import logo from '../assets/logo.svg'
import "./style/Header.css"
import { useSelector } from 'react-redux';

function Header() {

    return (
        <div className='header'>
            <img className='logo' src={logo}></img>
            <User/>
            <Search/>
        </div>
    );
}

export default Header;