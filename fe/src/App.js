/* BrowserRouter wraps the whole app to enable routing.*/
/* Routes has all route definitions. */
import { BrowserRouter, Routes, Route } from 'react-router-dom';   
import ProtectedRoute from "./components/ProtectedRoute";

import Login from './pages/Login';

import Register from './pages/Register';
import RegisterStudent from './pages/RegisterStudent';
import RegisterExpert from './pages/RegisterExpert';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Home from './pages/Home';
import Guidelines from "./pages/Guidelines";

import Read from "./pages/ReadPage";
import ReadCategory from "./pages/ReadCategory";



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

        <Route path="/guidelines" element={<Guidelines />} />

        <Route path="/read" element={<Read />} />
        <Route path="/read/:categoryId" element={<ReadCategory />} />
      </Routes>
    </BrowserRouter>
  );
}

{ /*function App() {
  return (
    <BrowserRouter>
      <Routes>
 
        {/* Public routes accessible without login*/}
        { /*<Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/student" element={<RegisterStudent />} />
        <Route path="/register/expert" element={<RegisterExpert />} /> */}
 
        {/* ── Protected routes — redirect to /login if not authenticated */}
       { /* <Route path="/guidelines" element={
          <ProtectedRoute><Guidelines /></ProtectedRoute>
        } />

        <Route path="/write" element={
          <ProtectedRoute><Guidelines /></ProtectedRoute>
        } />*/}
 
        {/* Uncomment and add pages as you build them:
        <Route path="/write" element={
          <ProtectedRoute><WritePage /></ProtectedRoute>
        } />
        <Route path="/read" element={
          <ProtectedRoute><ReadPage /></ProtectedRoute>
        } />
        <Route path="/faq" element={
          <ProtectedRoute><FAQPage /></ProtectedRoute>
        } />
        <Route path="/contact" element={
          <ProtectedRoute><ContactPage /></ProtectedRoute>
        } />
        */}
 
      {/*</Routes>
    </BrowserRouter>
  );
} */}
 
export default App;
