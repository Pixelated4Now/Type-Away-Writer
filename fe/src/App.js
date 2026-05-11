import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home          from './pages/Home';
import Login         from './pages/Login';
import Register      from './pages/Register';
import RegisterStudent from './pages/RegisterStudent';
import RegisterExpert  from './pages/RegisterExpert';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import Guidelines    from './pages/Guidelines';
import Dashboard     from './pages/Dashboard';

import Read          from './pages/ReadPage';
import ReadCategory  from './pages/ReadCategory';
import ReadStory     from './pages/ReadStory';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/"                    element={<Home />} />
          <Route path="/login"               element={<Login />} />
          <Route path="/register"            element={<Register />} />
          <Route path="/register/student"    element={<RegisterStudent />} />
          <Route path="/register/expert"     element={<RegisterExpert />} />
          <Route path="/forgot-password"     element={<ForgotPassword />} />
          <Route path="/reset-password"      element={<ResetPassword />} />
          <Route path="/guidelines"          element={<Guidelines />} />
          <Route path="/read"                element={<Read />} />
          <Route path="/read/:categoryId"    element={<ReadCategory />} />
          <Route path="/read/story/:storyId" element={<ReadStory />} />

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
