import React from 'react'
import './Login.css'

const Login = () => {
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

                <div className="pwd-input">
                    <div className="input-box">
                        <label for="pwd">Password:</label>
                        <input type="password" id="pwd" required />
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