import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/logoBase.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <div className="navbar-brand">
          <Link to="/"><img src={logo} alt="TypeAway logo" className="navbar-logo"/></Link>
        </div>

        
        <ul className="navbar-links">
          <li>
            <Link to="/" className={isActive("/") ? "active" : ""}>Home</Link>
          </li>
          <li>
            <Link to="/write" className={isActive("/write") ? "active" : ""}>Write</Link>
          </li>
          <li>
            <Link to="/read" className={location.pathname.startsWith("/read") ? "active" : ""}>Read</Link>
          </li>
          <li>
            <Link to="/contact" className={isActive("/contact") ? "active" : ""}>Contact Us</Link>
          </li>
          <li>
            <Link to="/guidelines" className={isActive("/guidelines") ? "active" : ""}>Guidelines</Link>
          </li>
        </ul>

        <div className="navbar-actions">
          <button className="btn-signin" onClick={() => navigate("/login")}>Sign In</button>
          <button className="btn-signup" onClick={() => navigate("/register")}>Sign Up</button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;


