import React from 'react';
import {useSelector, useDispatch} from 'react-redux'
import {UserIcon} from '../assets/icons'
import { useHistory } from "react-router-dom";

import "./style/User.css"

function User() {
    const dispatch = useDispatch()
    const history = useHistory()
    history.goBack()
    let user = useSelector(state => state.user)
    const quit = () => {
        dispatch(setUser({}))
        history.goBack()
    }
    return (
        <div className='user'>
           <div className="user-icon"><UserIcon/></div>
           <div className="user-quit" onClick={quit}>QUIT</div>
           <div className="user-name">{user.username}</div>
        </div>
    );
}

export default User;