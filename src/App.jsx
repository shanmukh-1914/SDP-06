import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import RegisterChoice from './components/RegisterChoice';
import AdminSignup from './components/AdminSignup';
import Landing from './components/Landing';
import LoginChoice from './components/LoginChoice';
import GoogleAuth from './components/GoogleAuth';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import Investments from './components/Investments';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';
import Resources from './components/Resources';
import Support from './components/Support';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Home page is the first page users see */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-choice" element={<LoginChoice />} />
          <Route path="/google" element={<GoogleAuth />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/register" element={<RegisterChoice />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
