import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaLock,
  FaHome,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import "./ClientAuth.css";

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];

function ClientAuth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    address: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const strength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const clearForm = () => {
    setFormData({
      full_name: "",
      mobile: "",
      address: "",
      email: "",
      password: "",
      confirm_password: "",
    });
  };

  const switchMode = (loginMode) => {
    if (submitting) return;
    clearForm();
    setIsLogin(loginMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirm_password) {
      alert("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      if (isLogin) {
        // ================= LOGIN =================

        const response = await API.post("client/login/", {
          email: formData.email,
          password: formData.password,
        });

        alert(response.data.message);

        localStorage.setItem("client", JSON.stringify(response.data.client));

        navigate("/client/dashboard");
      } else {
        // ================= REGISTER =================

        const response = await API.post("client/register/", {
          full_name: formData.full_name,
          mobile: formData.mobile,
          address: formData.address,
          email: formData.email,
          password: formData.password,
        });

        alert(response.data.message);

        clearForm();
        setIsLogin(true);
      }
    } catch (error) {
      console.log(error);

      if (error.response) {
        if (error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert(JSON.stringify(error.response.data));
        }
      } else {
        alert("Server connection failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="client-auth-container">
      <div className="client-auth-card">
        {/* LEFT SIDE */}
        <div className="client-left">
          <div className="client-left__texture" aria-hidden="true" />

          <div className="client-emblem">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.6" opacity="0.5" />
              <path
                d="M14 20l10-7 10 7v15a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V20z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M20 37v-8h8v8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>

          <span className="client-left__eyebrow">Client Portal</span>
          <h1>Welcome</h1>
          <p>
            Access your case information, hearing schedule and advocate
            details — all in one place.
          </p>

          <div className="client-left__rule" aria-hidden="true" />
          <span className="client-left__est">Secure Client Access</span>
        </div>

        {/* RIGHT SIDE */}
        <div className="client-right">
          <div className="client-tabs">
            <button
              type="button"
              className={isLogin ? "is-active" : ""}
              onClick={() => switchMode(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={!isLogin ? "is-active" : ""}
              onClick={() => switchMode(false)}
            >
              Register
            </button>
            <span
              className="client-tabs__slider"
              data-pos={isLogin ? "left" : "right"}
            />
          </div>

          <h2>{isLogin ? "Welcome Back" : "Create Your Account"}</h2>
          <p className="client-right__sub">
            {isLogin
              ? "Sign in to view your case status and hearings."
              : "Register to track your case with your advocate."}
          </p>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="field-row">
                  <label className="input-box">
                    <FaUser />
                    <div>
                      <span>Full Name</span>
                      <input
                        type="text"
                        name="full_name"
                        placeholder="Your full name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </label>

                  <label className="input-box">
                    <FaPhoneAlt />
                    <div>
                      <span>Mobile Number</span>
                      <input
                        type="text"
                        name="mobile"
                        placeholder="10-digit mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </label>
                </div>

                <label className="input-box">
                  <FaHome />
                  <div>
                    <span>Address</span>
                    <input
                      type="text"
                      name="address"
                      placeholder="City, state"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
              </>
            )}

            <label className="input-box">
              <FaEnvelope />
              <div>
                <span>Email Address</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </label>

            <label className="input-box">
              <FaLock />
              <div>
                <span>Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <button
                type="button"
                className="input-box__toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </label>

            {!isLogin && formData.password && (
              <div className="strength">
                <div className="strength__bars">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={i < strength ? `is-filled s${strength}` : ""}
                    />
                  ))}
                </div>
                <span className="strength__label">
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
            )}

            {!isLogin && (
              <label className="input-box">
                <FaLock />
                <div>
                  <span>Confirm Password</span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirm_password"
                    placeholder="••••••••"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button
                  type="button"
                  className="input-box__toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </label>
            )}

            {isLogin && (
              <div className="options">
                <label>
                  <input type="checkbox" /> Remember Me
                </label>
                <a href="#">Forgot Password?</a>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="submit-spinner" />
                  {isLogin ? "Signing In…" : "Registering…"}
                </>
              ) : isLogin ? (
                "LOGIN"
              ) : (
                "REGISTER"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClientAuth;