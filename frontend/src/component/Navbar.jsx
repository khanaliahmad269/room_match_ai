import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import toast from "react-hot-toast";
import { useState } from "react";
import Loader from "./Loader";

export function Navbar() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("auth");

    // Reset global auth state
    setAuth({
      user: null,
      token: null,
      isAuthenticated: false,
    });

    toast.success("Logged out successfully!");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      {loading ? <Loader/> : null}
      <div className="container-fluid">
        <a className="navbar-brand" href="#">Room Matcher</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/profile">Profile</Link>
            </li>
            {auth ? <li className="nav-item">
          <button 
            className="btn btn-link nav-link text-danger fw-medium" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </li> : null}
          </ul>
        </div>
      </div>
    </nav>
  )
}