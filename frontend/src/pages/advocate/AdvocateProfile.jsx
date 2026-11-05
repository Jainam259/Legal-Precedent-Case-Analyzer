import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaBalanceScale,
  FaEdit,
  FaSave,
  FaTimes,
  FaSignOutAlt,
  FaBriefcase,
  FaFolderOpen,
  FaCheckCircle,
  FaCalendarAlt,
  FaLock,
  FaKey,
  FaAward,
  FaTrophy,
  FaRupeeSign,
  FaGavel,
} from "react-icons/fa";

import "./AdvocateProfile.css";

function initials(name) {
  if (!name) return "AD";

  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function AdvocateProfile() {
  const navigate = useNavigate();

  const advocate = JSON.parse(localStorage.getItem("advocate")) || {};

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    bar_number: "",
    created_at: "",
    experience_years: 0,
    cases_won: 0,
    case_fees: "",
    specialization: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    hearings: 0,
  });

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStatistics();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await API.get(`/advocate/profile/${advocate.id}/`);

      if (res.data.success) {
        setProfile(res.data.advocate);
      }
    } catch (err) {
      console.log(err);
      alert("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const res = await API.get(`/cases/all/?advocate_id=${advocate.id}`);

      const cases = res.data;

      const total = cases.length;

      const active = cases.filter(
        (c) => (c.case?.status || "").toLowerCase() !== "closed"
      ).length;

      const closed = cases.filter(
        (c) => (c.case?.status || "").toLowerCase() === "closed"
      ).length;

      const today = new Date();

      const hearings = cases.filter((c) => {
        const hearing = c.case?.hearing_date;
        if (!hearing) return false;
        const d = new Date(hearing);
        return d >= today;
      }).length;

      setStats({ total, active, closed, hearings });
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const saveProfile = async () => {
    try {
      setSaving(true);

      const res = await API.put(
        `/advocate/profile/update/${advocate.id}/`,
        profile
      );

      alert(res.data.message);

      localStorage.setItem(
        "advocate",
        JSON.stringify({ ...advocate, ...profile })
      );

      setEditMode(false);
    } catch (err) {
      console.log(err);
      alert("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("advocate");
    navigate("/advocate");
  };

  if (loading) {
    return (
      <div className="ap-loading">
        <span className="ap-loading-mark" />
        Retrieving profile…
      </div>
    );
  }

  return (
    <div className="ap-page">
      {/* ================= HEADER ================= */}
      <div className="ap-header">
        <button className="ap-back-btn" onClick={() => navigate("/advocate/dashboard")}>
          <FaArrowLeft />
          Back
        </button>

        <div>
          <span className="ap-eyebrow">Personnel Record</span>
          <h1>Advocate Profile</h1>
        </div>
      </div>

      {/* ================= PROFILE HERO ================= */}
      <div className="ap-hero">
        <div className="ap-hero-texture" aria-hidden="true" />

        <div className="ap-avatar">{initials(profile.full_name)}</div>

        <h2>{profile.full_name}</h2>
        <p>{profile.email}</p>

        <span className="ap-badge">Advocate</span>
      </div>

      {/* ================= STATS ================= */}
      <div className="ap-stats-grid">
        <div className="ap-stat-card">
          <FaFolderOpen className="ap-stat-icon" />
          <h2>{stats.total}</h2>
          <p>Total Cases</p>
        </div>

        <div className="ap-stat-card">
          <FaBriefcase className="ap-stat-icon" />
          <h2>{stats.active}</h2>
          <p>Active Cases</p>
        </div>

        <div className="ap-stat-card">
          <FaCheckCircle className="ap-stat-icon" />
          <h2>{stats.closed}</h2>
          <p>Closed Cases</p>
        </div>

        <div className="ap-stat-card">
          <FaCalendarAlt className="ap-stat-icon" />
          <h2>{stats.hearings}</h2>
          <p>Upcoming Hearings</p>
        </div>
      </div>

      {/* ================= DETAILS ================= */}
      <div className="ap-details-card">
        <div className="ap-details-header">
          <h2>Personal Information</h2>

          {!editMode ? (
            <button className="ap-edit-btn" onClick={() => setEditMode(true)}>
              <FaEdit />
              Edit Profile
            </button>
          ) : (
            <div className="ap-edit-buttons">
              <button className="ap-save-btn" disabled={saving} onClick={saveProfile}>
                <FaSave />
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                className="ap-cancel-btn"
                onClick={() => {
                  setEditMode(false);
                  loadProfile();
                }}
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="ap-form-grid">
          <div className="ap-form-group">
            <label>
              <FaUser />
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={profile.full_name}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="ap-form-group">
            <label>
              <FaEnvelope />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="ap-form-group">
            <label>
              <FaPhoneAlt />
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="ap-form-group ap-form-group--sealed">
            <label>
              <FaBalanceScale />
              Bar Council Number
              <FaLock className="ap-lock-icon" title="Sealed record — cannot be edited" />
            </label>
            <input type="text" value={profile.bar_number} disabled />
          </div>

          <div className="ap-form-group ap-form-group--sealed">
            <label>
              <FaCalendarAlt />
              Member Since
              <FaLock className="ap-lock-icon" title="Sealed record — cannot be edited" />
            </label>
            <input
              type="text"
              value={
                profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-IN")
                  : "-"
              }
              disabled
            />
          </div>
        </div>
      </div>

      {/* ================= PROFESSIONAL DETAILS ================= */}
      <div className="ap-details-card">
        <div className="ap-details-header">
          <h2>Professional Details</h2>
          <p className="ap-details-subtext">Shown to clients on the "All Advocates" list</p>
        </div>

        <div className="ap-form-grid">
          <div className="ap-form-group">
            <label>
              <FaAward />
              Experience (Years)
            </label>
            <input
              type="number"
              min="0"
              name="experience_years"
              value={profile.experience_years}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="ap-form-group">
            <label>
              <FaTrophy />
              Cases Won
            </label>
            <input
              type="number"
              min="0"
              name="cases_won"
              value={profile.cases_won}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="ap-form-group">
            <label>
              <FaRupeeSign />
              Case Fees
            </label>
            <input
              type="text"
              name="case_fees"
              placeholder="e.g. ₹5,000 / hearing"
              value={profile.case_fees}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="ap-form-group">
            <label>
              <FaGavel />
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              placeholder="e.g. Criminal Law, Family Law"
              value={profile.specialization}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="ap-action-card">
        <button className="ap-dashboard-btn" onClick={() => navigate("/advocate/dashboard")}>
          Dashboard
        </button>

        <button className="ap-password-btn" onClick={() => navigate("/advocate/change-password")}>
          <FaKey />
          Change Password
        </button>

        <button className="ap-logout-btn" onClick={logout}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );
}