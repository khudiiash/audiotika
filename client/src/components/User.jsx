import React from 'react';
import {useSelector, useDispatch} from 'react-redux'
import {UserIcon} from '../assets/icons'
import { useHistory } from "react-router-dom";
import {setUser } from '../redux'

import "./style/User.css"

function User() {
    const dispatch = useDispatch()
    const history = useHistory()
    history.goBack()
    let user = useSelector(state => state.user)
    const quit = () => {
        console.log('quittng')
        dispatch(setUser({}))
        history.push('/')
    }
    return (
        <div className='user'>
           <div className="user-icon"><UserIcon/></div>
           <div className="user-name">{user.username}</div>
           <button className="user-quit" onClick={() => quit()}>QUIT</button>

        </div>
    );
}

export default User;