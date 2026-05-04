import React, { useEffect, useState } from 'react';
import './Auth.css'; 
import { Link } from 'react-router-dom';

   
import { BsEye, BsEyeSlash } from "react-icons/bs";


const Login = () => {

     useEffect(() => {
        document.title = "Log in | Type-Away-Writer";
    }, []);

    const [show, setShow] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleClick = (e) => {
        e.preventDefault(); // prevents form submit
        setShow(!show);
    };

    // Format check for email address.
    const validateEmail = (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    };


    const handleSubmit = (e) => {
        e.preventDefault();
 
        let valid = true;
 
        // Validate email.
        if (!email) {
            setEmailError('Please fill in this field.');
            valid = false;
        } else if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address.');
            valid = false;
        } else {
            setEmailError('');
        }
 
        // Validate password.
        if (!password) {
            setPasswordError('Please fill in this field.');
            valid = false;
        } else {
            setPasswordError('');
        }
 
        if (!valid) return;
 
        // TODO: Connect to backend login route.
        console.log("Logging in with:", email, password);
    };
 


    // Page starts here.
    return (
        <div className='wrapper'>
            <div className="heading">
                <img src="/favicon.png" alt="Type-Away-Writer logo"/>
                <h1>Welcome Back!</h1>
                <p>Login to continue</p>
            </div>
            

            <form action="">
        
                <div className="input-box">
                    <label htmlFor="email">Email Address:</label>
                    <input type="text" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ border: emailError ? '2px solid red' : '' }} />
                    {emailError && (
                        <p style={{ color: 'red', fontSize: '14px', marginTop: '6px' }}>
                            {emailError}
                        </p>
                    )}
                </div>

                
                <div className="input-box">
                    <label htmlFor="pwd">Password:</label>
                    <div className="password-box" style={{ border: passwordError ? '2px solid red' : '' }}>
                        <input type={show ? "text" : "password"} id="pwd" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button className='password-eye' onClick={handleClick}>
                            {show ? <BsEyeSlash /> : <BsEye />}
                        </button>
                    </div>
                    {passwordError && (
                        <p style={{ color: 'red', fontSize: '14px', marginTop: '6px' }}>
                            {passwordError}
                        </p>
                    )}
                </div>
               


                <div className="forgot">
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>

                <button type="submit">Log in</button>
                <div className="register-link">
                    <p>Don’t have an account?   <Link to="/register">Register</Link>.</p>
                </div>
            </form>

        </div>

    );
};




export default Login;