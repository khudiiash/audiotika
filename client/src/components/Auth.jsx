import React, {useState, useEffect, useRef, createRef} from 'react';
import {useDispatch, useSelector} from "react-redux"
import { setUser } from "../redux"
import { useHistory, useLocation } from "react-router-dom";
import {varify} from './_utils'
import axios from 'axios'
import "./style/Registration.css"
import gsap from 'gsap'

function Auth() {
    const history = useHistory();

    const [isRegistration, setRegistration] = useState(false)

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [email, setEmail] = useState("")
    const proxy = useSelector(state => state.proxy)


    let me = useSelector(state => state.user)
    let location = useLocation();
 
    const [error, setError] = useState({})


    const circles = createRef();

    const dispatch = useDispatch()

    

    useEffect(() => {
        console.log('Auth Effect')
        console.log(location.pathname.includes('/app'))
        if (me && me.username && !location.pathname.includes('/app')) history.push('/app')
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
   const onSignUp = (e) => {
       e.preventDefault()
       let user = {
          username,
          email,
          password
       }

       let errors = varify(user)
       if (errors.any) {
           setError(errors)
       } else {
        if (errors.username || errors.password) setError(errors)
        else {
            axios.post(proxy + '/user/login', {user, isSignUp: true, isSignIn: false})
            .then((res) => {
                if (res.data) dispatch(setUser(res.data))
                else if (JSON.parse(res?.config?.data)) {
                    dispatch(setUser(JSON.parse(res.config.data).user))
                }
                else {
                    errors.login = "Failed to sign up"
                    setError(errors)
                }
            })
            .catch(err => console.log(err))
        }
       
       }
   }
   const onSignIn= (e) => {
    e.preventDefault()
    let user = {
       username,
       password
    }
    let errors = varify(user)
    errors.email = ""
    if (!errors.username && !errors.password) {errors.any = false}
    
    if (errors.any) {
        console.log(errors)
        setError(errors)
    } else {
         axios.post(proxy + '/user/login', {user, isSignUp: false, isSignIn: true})
         .then((res) => {
             console.log(res)
             if (res.data) {
                 history.push('/app')
                 dispatch(setUser(res.data))
             }
             else {
                errors.login = "Wrong username or password"
                setError(errors)
             } 
         })
         .catch(err => console.log(err))
     }
    
   }

   const onInputFocus =()=> {
       setError({})
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
           <form onSubmit={isRegistration ? onSignUp : onSignIn} className="registration-form">
           <div className="registration-form-header">
                <div className='registration-error' style={{height: error && error.login ? "10%" : 0}}>{error.login}</div>
           </div>
            
            <input className="registration-form-username" 
                type="username" 
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
                onFocus={onInputFocus}
            >
            </input><div className='registration-error' style={{height: error && error.username ? "10%" : 0}}>{error.username}</div>
            <input className="registration-form-email" 
                style={{height: isRegistration ? "15%" : 0, margin: isRegistration ? "10px" : 0}}
                type="email" 
                placeholder="Email"
                onFocus={onInputFocus}
                onChange={(e) => setEmail(e.target.value)}></input><div className='registration-error' style={{height: error && error.email ? "10%" : 0}}>{error.email}</div>
            <input className="registration-form-password" 
                type="password" 
                placeholder="Password"
                onFocus={onInputFocus}
                onChange={(e) => setPassword(e.target.value)}></input><div className='registration-error' style={{height: error && error.password ? "10%" : 0}}>{error.password}</div>
            <button className="registration-form-button" 
                type="submit">{isRegistration ? "Sign up":"Sign in"}</button>
            <div className='registration-footer' onClick={() => setRegistration(!isRegistration)}>{isRegistration ? "Sign in" : "Create an account"}</div>
           </form> 
           
         
        </div>
    );
}

export default Auth;