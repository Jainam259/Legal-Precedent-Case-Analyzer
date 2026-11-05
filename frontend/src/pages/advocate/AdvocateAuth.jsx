import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaBalanceScale,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaPhoneAlt,
  FaUser,
} from "react-icons/fa";
import "./AdvocateAuth.css";

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

function AdvocateAuth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    bar_number: "",
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

  const switchMode = (loginMode) => {
    if (submitting) return;
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
        const response = await axios.post(
          "http://127.0.0.1:8000/api/advocate/login/",
          {
            email: formData.email,
            password: formData.password,
          }
        );

        if (response.data.success) {
          localStorage.setItem(
            "advocate",
            JSON.stringify(response.data.advocate)
          );

          alert(response.data.message);
          navigate("/advocate/dashboard");
        } else {
          alert(response.data.message);
        }
      } else {
        const response = await axios.post(
          "http://127.0.0.1:8000/api/advocate/register/",
          {
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email,
            bar_number: formData.bar_number,
            password: formData.password,
          }
        );

        alert(response.data.message);

        setFormData({
          full_name: "",
          phone: "",
          email: "",
          bar_number: "",
          password: "",
          confirm_password: "",
        });

        setIsLogin(true);
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Left */}
        <div className="left-panel">
          <div className="left-panel__facade" aria-hidden="true" />

          <div className="emblem">
            <svg viewBox="0 0 48 48" fill="none">
              <path
                d="M24 4v40M10 12h28M10 12l-6 12a6 6 0 0 0 12 0zM38 12l6 12a6 6 0 0 1-12 0zM17 44h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <span className="left-panel__eyebrow">Chamber of Admission</span>
          <h1>Advocate Portal</h1>
          <p>Justice Delayed is Justice Denied.</p>

          <div className="left-panel__rule" aria-hidden="true" />
          <span className="left-panel__est">Est. Practice Registry</span>
        </div>

        {/* Right */}
        <div className="right-panel">
          <div className="auth-tabs">
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
              className="auth-tabs__slider"
              data-pos={isLogin ? "left" : "right"}
            />
          </div>

          <h2>{isLogin ? "Welcome Back" : "New Practice Registration"}</h2>
          <p className="right-panel__sub">
            {isLogin
              ? "Sign in to access your case docket."
              : "Fill in your credentials to open a practice file."}
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
                        placeholder="Harshit Sharma"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </label>

                  <label className="input-box">
                    <FaPhoneAlt />
                    <div>
                      <span>Phone Number</span>
                      <input
                        type="text"
                        name="phone"
                        placeholder="10-digit mobile"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </label>
                </div>

                <label className="input-box">
                  <FaBalanceScale />
                  <div>
                    <span>Bar Council Number</span>
                    <input
                      type="text"
                      name="bar_number"
                      placeholder="e.g. GJ/1234/2018"
                      value={formData.bar_number}
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
                <span>Email</span>
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

export default AdvocateAuth;