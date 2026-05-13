import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Home            from './pages/Home';
import Login           from './pages/Login';
import Register        from './pages/Register';
import RegisterStudent from './pages/RegisterStudent';
import RegisterExpert  from './pages/RegisterExpert';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import Guidelines      from './pages/Guidelines';

import Read          from './pages/ReadPage';
import ReadCategory  from './pages/ReadCategory';
import ReadStory     from './pages/ReadStory';

import StorySettings from './pages/StorySettings';
import StoryEditor   from './pages/StoryEditor';
import StoryPreview  from './pages/StoryPreview';
import Review        from './pages/Review';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
};

const ExpertRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.account_type !== 'expert') return <Navigate to="/" replace />;
  return children;
};

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

          {/* Protected — writing flow */}
          <Route path="/write/new"             element={<ProtectedRoute><StorySettings /></ProtectedRoute>} />
          <Route path="/write/:id/settings"    element={<ProtectedRoute><StorySettings /></ProtectedRoute>} />
          <Route path="/write/:id/chapters"    element={<ProtectedRoute><StoryEditor /></ProtectedRoute>} />
          <Route path="/write/:id/preview"     element={<ProtectedRoute><StoryPreview /></ProtectedRoute>} />

          {/* Expert only */}
          <Route path="/review"                element={<ExpertRoute><Review /></ExpertRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
