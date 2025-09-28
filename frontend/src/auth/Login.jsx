import { useState } from "react";
import { Link, useNavigate, } from "react-router-dom";
import Loader from "../component/Loader";
import axios from "axios"
import { useAuth } from "../state/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { auth, setAuth } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // ✅ track loading

  // Handle input change + clear error
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!formData.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) return;

    try {
      setLoading(true); 
      const res = await axios.post("http://127.0.0.1:8000/login", formData);
    
      if (res.data?.access_token) {
        // Save token & user in localStorage
        localStorage.setItem("token", res.data.access_token);
    
        localStorage.setItem("auth", JSON.stringify({
          user: res.data.user,
          token: res.data.access_token,
          isAuthenticated: true
        }));
        setAuth({
          user: res.data.user,
          token: res.data.access_token,
          isAuthenticated: true
        });
        toast.success(`Welcome back, ${res.data.user.name} 🎉`);
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast.error(err.detail || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
      {loading ? <Loader/> : null}
      <div
        className="card shadow-lg rounded-3 p-4"
        style={{ maxWidth: "420px", width: "100%" }}
      >
        <h1 className="h4 fw-semibold text-center text-dark">Welcome back</h1>
        <p className="text-muted small text-center mt-2">
          Sign in to continue to your account
        </p>

        <form className="mt-4" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label small fw-medium text-secondary">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label small fw-medium text-secondary">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Your password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>

          {/* Forgot password */}
          <div className="d-flex justify-content-end align-items-center mb-3">
            <a href="#" className="small text-primary text-decoration-none">
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-100 fw-medium shadow-sm"
          >
            Sign in
          </button>

          {/* Sign up link */}
          <p className="text-center small text-muted mt-3">
            Don&apos;t have an account?{" "}
            <Link to="/signUp" className="text-primary text-decoration-none">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
