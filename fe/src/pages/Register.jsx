import { useNavigate } from "react-router-dom";
import "./Auth.css";


const RegisterPage = () => {
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
          <div className="register-avatar">
            <img src="../assets/individual.png" alt="Individual or Student" />
          </div>
          <h2>Individual/ Student</h2>
          <p>Explore Type-Away-Writer! Read, write, and publish stories.</p>
          <button onClick={() => handleRegister("student")}>Register</button>
        </div>

        <div className="register-card">
          <div className="register-avatar expert">
            <img src="../assets/expert.png" alt="Language Expert" />
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
        <a href="/login">Log in</a>
      </p>
    </div>
  );
};

export default RegisterPage;
