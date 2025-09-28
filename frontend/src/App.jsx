
import { Route, Routes, Navigate,  } from 'react-router-dom'
import './App.css'
import Login from './auth/Login'
import SignUp from './auth/SignUp'
import Dashboard from './component/Dashboard'
import Profile from './component/Profile'
import { Toaster } from "react-hot-toast";
import { useAuth } from "./state/AuthContext";

function App() {
  const { auth, setAuth } = useAuth();
  function LogoutHandler() {
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    setAuth({ user: null, token: null, isAuthenticated: false });
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Routes>
        {/* Protected route */}
        <Route
          path="/"
          element={
            auth?.isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          }
        />
        {/* Protected route */}
        <Route
          path="/profile"
          element={
            auth?.isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
          }
        />

        {/* Auth pages */}
        <Route
          path="/login"
          element={
            auth?.isAuthenticated ? <Navigate to="/" replace /> : <Login />
          }
        />
        <Route
          path="/signUp"
          element={
            auth?.isAuthenticated ? <Navigate to="/" replace /> : <SignUp />
          }
        />
      <Route
        path="/logout"
        element={
          <LogoutHandler />
        }
      />
        </Routes>
        <Toaster position="top-right" reverseOrder={false} />
    </>
  )
}

export default App;
