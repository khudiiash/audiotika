import React from 'react';
import {useSelector, useDispatch} from 'react-redux'
import {UserIcon,QuitIcon} from '../assets/icons'
import { useHistory } from "react-router-dom";
import {setUser } from '../redux'

import "./style/User.css"

function User() {
    const dispatch = useDispatch()
    const history = useHistory()
    let user = useSelector(state => state.user)
    const quit = () => {
        console.log('quittng')
        dispatch(setUser({}))
        history.push('/')
    }
    return (
        <div className='user'>
           <div className="user-quit" onClick={quit}><QuitIcon/></div>
           <div className="user-icon"><UserIcon/></div>
           <div className="user-name">{user.username}</div>

        </div>
    );
}

export default User;