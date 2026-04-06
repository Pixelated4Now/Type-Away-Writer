import React, { useState } from 'react'
import './Login.css'

import { BsEye, BsEyeSlash } from "react-icons/bs";


const Login = () => {

    const [show, setShow] = useState(false);

    const handleClick = (e) => {
        e.preventDefault(); // prevents form submit
        setShow(!show);
    };


    return (
        <div className='wrapper'>
            <div className="heading">
                <img src="/favicon.png" />
                <h1>Welcome Back!</h1>
                <p>Login to continue</p>
            </div>
            

            <form action="">
        
                <div className="input-box">
                    <label for="email">Email Address:</label>
                    <input type="text" id="email" required />
                </div>

                
                <div className="input-box">
                    <label for="pwd">Password:</label>
                    <div className="password-box">
                        <input type={show ? "text" : "password"} id="pwd" required />
                        <button className='password-eye' onClick={handleClick}>
                            {show ? <BsEyeSlash /> : <BsEye />}
                        </button>
                    </div>
                </div>
               


                <div className="forgot">
                    <a href="#">Forgot password?</a>
                </div>

                <button type="submit">Log in</button>
                <div className="register-link">
                    <p>Don’t have an account?   <a href="#">Register</a>.</p>
                </div>
            </form>

        </div>

    );
};




export default Login;