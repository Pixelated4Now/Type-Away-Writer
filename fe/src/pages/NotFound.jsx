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
        <>
            <style>{`
            .not-found-page {
                font-family: 'Manrope', sans-serif;
                color: #111;
                background: #fff;
                width: 100vw;
            }

            .not-found-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                margin: 0 auto;
                padding: 0px 48px 72px;
            }

            .not-found-content img {
                width: 624px;
                height: auto;
                display: block;
                margin-bottom: 20px;
            }

            .not-found-content h2 {
                font-size: 40px;
                font-weight: 900;
                color: #0E72E5;
                margin: 0 0 12px;
            }

            .not-found-content p {
                font-size: 15px;
                font-weight: 500;
                color: #333;
                line-height: 1.55;
                margin-bottom: 24px;
            }

            @media (max-width: 600px) {
                .not-found-content h2 {
                    font-size: 28px;
                }
            
                .not-found-content img {
                    width: 280px;
                }
            }
                            
            `}</style> 

            <div className="not-found-page">
                <Navbar />

                <div className="not-found-content">
                    <img src={errorImg} alt="Page not found error image" />

                
                    <h2>Whoops, looks like you wandered off the map!</h2>
                    <p>The page you are trying to access does not exist or has been moved.<br/>Try going back to our homepage.</p>

                    <button className="btn-start-writing" onClick={() => navigate("/")}>BACK TO HOME</button>
                   

                </div>

                <Footer />
            </div>
        </>
        
    );

}

export default NotFound;