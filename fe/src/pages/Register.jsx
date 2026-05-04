import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import "./Auth.css";
import "./Register.css";

/* Import images from assets/ folder */
import studentImg from "../assets/individual.png";
import expertImg from "../assets/expert.png";


const Register = () => {
  const navigate = useNavigate();

  const handleRegister = (role) => {
    if (role === "student") {
      navigate("/register/student");
    } else if (role === "expert") {
      navigate("/register/expert");
    }
  };

  return (
    <div className="register-page">


      <div className="register-cards">

        <div className="register-card">
          <div className="register-avatar student-avatar">
            <img src={studentImg} alt="Individual or Student" />
          </div>
          <h2>Individual/ Student</h2>
          <p>Explore Type-Away-Writer! Read, write, and publish stories.</p>
          <button onClick={() => handleRegister("student")}>Register</button>
        </div>

        <div className="register-card">
          <div className="register-avatar expert">
            <img src={expertImg} alt="Language Expert" />
          </div>
          <h2>Language Expert</h2>
          <p>
            Help young authors improve their writing by offering them advice on
            their stories.
          </p>
          <button onClick={() => handleRegister("expert")}>Register</button>
        </div>

      </div>

      <p className="register-footer">
        Already have an account?{" "}
        <Link to="/">Log in</Link>
      </p>
    </div>
  );
};

export default Register;
