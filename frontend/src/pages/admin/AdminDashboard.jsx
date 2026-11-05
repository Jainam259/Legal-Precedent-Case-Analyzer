import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaFolderOpen,
  FaSignOutAlt,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import API from "../../api/axios";
import "./AdminDashboard.css";

const TABS = [
  { key: "advocates", label: "Advocates", icon: <FaBalanceScale /> },
  { key: "clients", label: "Clients", icon: <FaUsers /> },
  { key: "cases", label: "Cases", icon: <FaFolderOpen /> },
];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("advocates");
  const [stats, setStats] = useState(null);

  const [advocates, setAdvocates] = useState([]);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Guard the route: bounce to login if not authenticated as admin.
  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, advocatesRes, clientsRes, casesRes] = await Promise.all([
        API.get("admin/stats/"),
        API.get("admin/advocates/"),
        API.get("admin/clients/"),
        API.get("admin/cases/"),
      ]);
      setStats(statsRes.data);
      setAdvocates(advocatesRes.data);
      setClients(clientsRes.data);
      setCases(casesRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load admin data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("admin");
    navigate("/admin");
  };

  const deleteAdvocate = async (id) => {
    if (!window.confirm("Delete this advocate? Their cases will be deleted too.")) return;
    try {
      await API.delete(`admin/advocates/${id}/delete/`);
      setAdvocates((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete advocate.");
    }
  };

  const deleteClient = async (id) => {
    if (!window.confirm("Delete this client? Their cases will be deleted too.")) return;
    try {
      await API.delete(`admin/clients/${id}/delete/`);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete client.");
    }
  };

  const deleteCase = async (id) => {
    if (!window.confirm("Delete this case? This cannot be undone.")) return;
    try {
      await API.delete(`admin/cases/${id}/delete/`);
      setCases((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete case.");
    }
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <FaBalanceScale />
          <span>Case Analyzer</span>
        </div>

        <nav className="admin-sidebar__nav">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "is-active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <button className="admin-sidebar__logout" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage advocates, clients, and cases across the platform.</p>
        </header>

        {stats && (
          <div className="admin-stats">
            <div className="admin-stat-card">
              <span className="admin-stat-card__value">{stats.total_advocates}</span>
              <span className="admin-stat-card__label">Advocates</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__value">{stats.total_clients}</span>
              <span className="admin-stat-card__label">Clients</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__value">{stats.total_cases}</span>
              <span className="admin-stat-card__label">Total Cases</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__value">{stats.pending_cases}</span>
              <span className="admin-stat-card__label">Pending Cases</span>
            </div>
          </div>
        )}

        {error && <div className="admin-error-banner">{error}</div>}

        {loading ? (
          <div className="admin-loading">Loading…</div>
        ) : (
          <div className="admin-panel">
            {activeTab === "advocates" && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Bar Number</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {advocates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-empty">No advocates yet.</td>
                    </tr>
                  )}
                  {advocates.map((a) => (
                    <tr key={a.id}>
                      <td>{a.full_name}</td>
                      <td>{a.email}</td>
                      <td>{a.phone}</td>
                      <td>{a.bar_number}</td>
                      <td>{formatDate(a.created_at)}</td>
                      <td>
                        <button className="admin-delete-btn" onClick={() => deleteAdvocate(a.id)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "clients" && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Claimed</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-empty">No clients yet.</td>
                    </tr>
                  )}
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td>{c.full_name}</td>
                      <td>{c.email}</td>
                      <td>{c.mobile}</td>
                      <td>{c.is_claimed ? "Yes" : "No"}</td>
                      <td>{formatDate(c.created_at)}</td>
                      <td>
                        <button className="admin-delete-btn" onClick={() => deleteClient(c.id)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "cases" && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Case Title</th>
                    <th>Case No.</th>
                    <th>Advocate</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="admin-empty">No cases yet.</td>
                    </tr>
                  )}
                  {cases.map((c) => (
                    <tr key={c.id}>
                      <td>{c.case_title}</td>
                      <td>{c.case_number}</td>
                      <td>{c.advocate?.full_name || c.advocate}</td>
                      <td>{c.client?.full_name || "—"}</td>
                      <td>{c.case_type}</td>
                      <td>
                        <span className={`admin-status admin-status--${(c.status || "").toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button className="admin-delete-btn" onClick={() => deleteCase(c.id)}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
