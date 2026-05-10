import { useNavigate } from "react-router-dom";
import "./Footer.css";
import footerLogo from "../assets/logoBase.png";
import footerDoodles from "../assets/footerDoodles.png";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="home-footer">
      <div className="footer-left">
        <div className="footer-brand">
          <img src={footerLogo} alt="TypeAway logo" />
        </div>
        <h3>
          Join Type-Away-Writer<br />and start writing<br />today.
        </h3>
        <button className="btn-footer-signup" onClick={() => navigate("/register")}>
          SIGN UP
        </button>
      </div>

      <nav className="footer-links">
        <a href="/write">Write</a>
        <a href="/read">Read</a>
        <a href="/contact">Contact Us</a>
        <a href="/guidelines">Guidelines</a>
      </nav>
       <img src={footerDoodles} alt="" className="footer-doodle" />
       
    </footer>
  );
};

export default Footer;