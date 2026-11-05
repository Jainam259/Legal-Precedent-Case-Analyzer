import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaShieldAlt, FaUser } from "react-icons/fa";
import API from "../../api/axios";
import "./AdminAuth.css";

function AdminAuth() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await API.post("admin/login/", formData);

      if (response.data.success) {
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("admin", JSON.stringify(response.data.admin));
        navigate("/admin/dashboard");
      } else {
        setError(response.data.message || "Invalid credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-card">
        <div className="admin-auth-icon">
          <FaShieldAlt />
        </div>
        <h1>Admin Panel</h1>
        <p className="admin-auth-sub">Sign in to manage the platform.</p>

        <form onSubmit={handleSubmit}>
          <label className="admin-input-box">
            <FaUser />
            <div>
              <span>Username</span>
              <input
                type="text"
                name="username"
                placeholder="admin"
                value={formData.username}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
          </label>

          <label className="admin-input-box">
            <FaLock />
            <div>
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </label>

          {error && <div className="admin-auth-error">{error}</div>}

          <button type="submit" className="admin-submit-btn" disabled={submitting}>
            {submitting ? "Signing In…" : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminAuth;
