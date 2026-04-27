import React, { useState } from 'react';
import './Login.css'; // Reusing existing CSS file for consistency

import { BsEye, BsEyeSlash } from "react-icons/bs";

const ResetPassword = () => {
    

    return (
        <div className='wrapper reset-wrapper'>
            <div className="heading">
                <h1>Reset Your Password</h1>
                <p>Set a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit}>
                

                <div className="button-group">
                    <button type="button" className="btn-back password-back-button">Back</button>
                    <button type="submit" className="btn-reset">Reset Password</button>
                </div>
            </form>
        </div>
    );
};

export default ResetPassword;