import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Scheduler from "./pages/Scheduler";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import Transcript from "./pages/Transcript";
import Help from "./pages/Help";
import Home from "./pages/Home";
import "./styles/design-system.css";

// Navigation Component
// Update your Navigation component in App.jsx
const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('user_id'));

  // Listen for storage changes and custom events
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('user_id'));
    };

    const handleLoginEvent = () => {
      setIsLoggedIn(true);
    };

    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
    };

    // Listen for custom events
    window.addEventListener('userLogin', handleLoginEvent);
    window.addEventListener('userLogout', handleLogoutEvent);
    // Listen for localStorage changes from other tabs
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userLogin', handleLoginEvent);
      window.removeEventListener('userLogout', handleLogoutEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('parsed_classes');
    setIsLoggedIn(false);
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('userLogout'));
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          Plan-A-Gator
        </Link>
      </div>

      <div className="navbar-right">
        <ul className="navbar-nav">
          {isLoggedIn ? (
            <>
              <li>
                <Link 
                  to="/scheduler" 
                  className={`navbar-link ${isActive('/scheduler') ? 'active' : ''}`}
                >
                  Scheduler
                </Link>
              </li>
              <li>
                <Link 
                  to="/transcript" 
                  className={`navbar-link ${isActive('/transcript') ? 'active' : ''}`}
                >
                  Transcript
                </Link>
              </li>
              <li>
                <Link 
                  to="/help" 
                  className={`navbar-link ${isActive('/help') ? 'active' : ''}`}
                >
                  Help
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link 
                  to="/help" 
                  className={`navbar-link ${isActive('/help') ? 'active' : ''}`}
                >
                  Help
                </Link>
              </li>
              {/* <li>
                <Link 
                  to="/signin" 
                  className={`navbar-link ${isActive('/signin') ? 'active' : ''}`}
                >
                  Sign In
                </Link>
              </li> */}
              {/* <li>
                <Link 
                  to="/signup" 
                  className="btn btn-primary btn-sm"
                >
                  Sign Up
                </Link>
              </li> */}
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <Router>
      <Navigation />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/transcript" element={<Transcript />} />
          <Route path="/scheduler" element={<Scheduler />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<Signin />} />
        </Routes>
      </div>
    </Router>
  );
}
