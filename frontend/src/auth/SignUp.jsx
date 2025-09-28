import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../state/AuthContext"
import Loader from "../component/Loader";

export default function SignUp() {
  const { auth, setAuth } = useAuth();
  const [loading, setLoading] = useState(false); // ✅ track loading
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    let valid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
      valid = false;
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (!/^\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid phone number";
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

    if (valid) {
      try {
        const res = await axios.post("http://127.0.0.1:8000/signup", formData, {
          headers: { "Content-Type": "application/json" }
        });

        if (res.data.status === "success") {
          toast.success("Signup successful! 🎉");

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

          // Redirect to homepage
          navigate("/");
        } else {
          toast.error(res.data.message || "Signup failed ❌");
        }
      } catch (err) {
        // Handle different error types
        if (err.response?.status === 400) {
          const errorDetail = err.response.data?.detail;
          if (errorDetail === "Email already registered") {
            setErrors({ ...errors, email: "This email is already registered" });
            toast.error("Email already registered ❌");
          } else {
            toast.error(errorDetail || "Invalid input data ❌");
          }
        } else if (err.code === 'ECONNREFUSED') {
          toast.error("Cannot connect to server. Is the backend running? ❌");
        } else {
          toast.error("Something went wrong. Try again ❌");
        }
      }
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3">
      {loading ? <Loader/> : null}
      <div
        className="card shadow-lg rounded-3 p-4"
        style={{ maxWidth: "420px", width: "100%" }}
      >
        <p className="text-muted small text-center mt-2">
          Sign Up to continue to your account
        </p>

        <form className="mt-4" onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label small fw-medium text-secondary">
              Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="John"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

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

          <div className="mb-3">
            <label className="form-label small fw-medium text-secondary">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              placeholder="03XXXXXXXXX"
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && (
              <div className="invalid-feedback">{errors.phone}</div>
            )}
          </div>

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

          <div className="d-flex justify-content-end align-items-center mb-3">
            <a href="#" className="small text-primary text-decoration-none">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-medium shadow-sm"
          >
            Sign up
          </button>

          <p className="text-center small text-muted mt-3">
            Already have an Account?{" "}
            <Link to="/login" className="text-primary text-decoration-none">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
