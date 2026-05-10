import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/logoBase.png"; // replace with your actual logo path

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <div className="navbar-brand">
          <Link to="/"><img src={logo} alt="TypeAway logo" className="navbar-logo"/></Link>
        </div>

        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/write">Write</Link></li>
          <li><Link to="/read">Read</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
          <li><Link to="/guidelines">Guidelines</Link></li>
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