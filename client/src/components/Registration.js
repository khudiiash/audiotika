import React, {useState, useEffect, useRef, createRef} from 'react';
import {useDispatch} from "react-redux"
import { setUser } from "../redux"
import { useHistory } from "react-router-dom";

import FacebookLogin from 'react-facebook-login';
import axios from 'axios'
import "./style/Registration.css"
import gsap from 'gsap'

function Registration(props) {
    const history = useHistory();

    let [isLoggedIn, setLoggedIn] = useState(false)

    const circles = createRef();

    const mountedTL = useRef();
    const newBookTL = useRef();

    const dispatch = useDispatch()
    useEffect(() => {
       
        gsap.utils.toArray(circles.current.children).forEach(circle => {
            tweenProperty(circle, "scale", .8, 1);
            tweenProperty(circle, "x", -300, 300);
            tweenProperty(circle, "y", -300, 300);
            tweenProperty(circle, "opacity", 0.3, .8);
        });
  
    function tweenProperty(target, prop, min, max) {
        if (target.className.includes('first'))  {
            gsap.set(target, {zIndex: -1})
        } else {
            gsap.set(target, {zIndex: -2})
        }
    
    var randomDur = gsap.utils.random(7, 12, 0.2, true);
    var randomDelay = gsap.utils.random(0.2, 1.5, 0.2, true);
  
    gsap.to(target,  {
      [prop]: gsap.utils.random(min, max),
      zIndex: -2,
      duration: randomDur(), 
      delay: randomDelay(), 
      ease: 'none',
      onComplete: tweenProperty,
      onCompleteParams: [target, prop, min, max]
    });

    }
    }, [])
    const responseFacebook = (response) => {
        let {email, name} = response
        setLoggedIn(true)
        axios.post('/user/login', {name,email})
            .then(res => {  
                dispatch(setUser(res.data))
                history.push("/app");

            })
    }
    const onClicked = () => {
        console.log(process.env)
    }
    return (
        <div className='registration'>
            <div ref={circles} className="registration-circles">
            <div className="registration-circle first"></div>
            <div className="registration-circle second"></div>
            <div className="registration-circle third"></div>
            <div className="registration-circle fourth"></div>
            <div className="registration-circle fifth"></div>
            <div className="registration-circle sixth"></div>
        </div>
            <FacebookLogin
                appId='1621385711364237'
                autoLoad={true}
                fields="name,email,picture"
                onClick={onClicked}
                callback={responseFacebook}
            />
        </div>
    );
}

export default Registration;