/* BrowserRouter wraps the whole app to enable routing.*/
/* Routes has all route definitions. */
import { BrowserRouter, Routes, Route } from 'react-router-dom';   
import Login from './pages/Login';

import Register from './pages/Register';
import RegisterStudent from './pages/RegisterStudent';
import RegisterExpert from './pages/RegisterExpert';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Home from './pages/Home';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />
        <Route path="/register/student" element={<RegisterStudent />} />
        <Route path="/register/expert" element={<RegisterExpert />} />        
        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;