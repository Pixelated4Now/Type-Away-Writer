import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Footer.css";
import footerLogo from "../assets/logoBase.png";
import footerDoodles from "../assets/footerDoodles.png";

const Footer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigate = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

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
        <span onClick={() => handleNavigate(user ? "/write/new" : "/login")}>Write</span>
        <span onClick={() => handleNavigate("/read")}>Read</span>
        <span onClick={() => handleNavigate("/guidelines")}>Guidelines</span>
      </nav>
       <img src={footerDoodles} alt="" className="footer-doodle" />
       
    </footer>
  );
};

export default Footer;