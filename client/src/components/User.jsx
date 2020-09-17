import React from 'react';
import {useSelector} from 'react-redux'
import {UserIcon} from '../assets/icons'
import "./style/User.css"

function User() {

    let user = useSelector(state => state.user)
    console.log(user)

    return (
        <div className='user'>
           <div className="user-icon"><UserIcon/></div>
           <div className="user-name">{user.username}</div>
        </div>
    );
}

export default User;