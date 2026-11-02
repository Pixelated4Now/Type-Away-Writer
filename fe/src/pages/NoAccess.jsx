import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Home.css";
import "./ErrorPage.css";

import errorImg from "../assets/error403.png"; 

const NoAccess = () => {
    useEffect(() => { document.title = "Not Allowed | Type-Away-Writer"; }, []);

    const navigate = useNavigate();

    return (
        
        <div className="error-page">
            <Navbar />

            <div className="error-content">
                <img src={errorImg} alt="Access not allowed error image" />

            
                <h2>Who dares trip trap over my bridge?</h2>
                <p>Sorry, you do not have permission to access the page you were trying to reach.<br/>Try going back to our homepage.</p>

                <button className="btn-start-writing" onClick={() => navigate("/")}>BACK TO HOME</button>
                

            </div>

            <Footer />
        </div>
        
        
    );

}

export default NoAccess;