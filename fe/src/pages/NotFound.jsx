import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Home.css";
import "./ErrorPage.css";

import errorImg from "../assets/errorNotFound.png"; 

const NotFound = () => {
    useEffect(() => { document.title = "Page Not Found | Type-Away-Writer"; }, []);

    const navigate = useNavigate();

    return (
        
        <div className="error-page">
            <Navbar />

            <div className="error-content">
                <img src={errorImg} alt="Page not found error image" />

            
                <h2>Whoops, looks like you wandered off the map!</h2>
                <p>The page you are trying to access does not exist or has been moved.<br/>Try going back to our homepage.</p>

                <button className="btn-start-writing" onClick={() => navigate("/")}>BACK TO HOME</button>
                

            </div>

            <Footer />
        </div>
        
        
    );

}

export default NotFound;