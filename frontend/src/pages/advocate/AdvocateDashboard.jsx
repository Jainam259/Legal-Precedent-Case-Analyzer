  import { useEffect, useMemo, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import API from "../../api/axios";
  import "./AdvocateDashboard.css";

  /* Pull the first present key from an object, trying a few naming
    conventions so this survives snake_case vs camelCase API responses. */
  function pick(obj, keys, fallback = "—") {
    if (!obj) return fallback;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return fallback;
  }

  function initials(name) {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  /* Your API's "summary" field is a full nested analysis object
    ({ id, summary, case_story, ai_confidence, case, ... }), not plain
    text. Pull a renderable string out of it instead of using the
    object itself. */
  function extractAiSummary(item) {
    const raw = item.ai_summary || item.summary || item.analysis;
    if (!raw) return "";
    if (typeof raw === "string") return raw;
    return raw.summary || raw.case_story || "";
  }

  function formatDate(value) {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  export default function AdvocateDashboard() {
    const navigate = useNavigate();

    let advocate = {};

  try {
    advocate = JSON.parse(localStorage.getItem("advocate")) || {};
  } catch (e) {
    console.error(e);
  }

    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
      fetchCases();
    }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(false);

      const advocate = JSON.parse(localStorage.getItem("advocate"));

      const res = await API.get(
        `/cases/all/?advocate_id=${advocate.id}`
      );

      setCases(res.data);

    } catch (err) {
      console.log(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

    /* Normalize every case into the shape this page needs, regardless
      of the exact key names the API uses. */
    const normalized = useMemo(() => {
      return cases.map((item) => {
        // Case metadata (client, case number, court, etc.) lives under
        // item.case; fall back to the item itself in case some endpoints
        // return it flat.
        const c = item.case || item;

        const clientName = pick(c.client, ["full_name", "name"]) !== "—"
          ? pick(c.client, ["full_name", "name"])
          : pick(c, ["client_name", "clientName"]);

        const hearingRaw = pick(
          c,
          ["hearing_date", "hearingDate", "next_hearing", "nextHearing"],
          null
        );

        return {
          id: c.id ?? item.id,
          number: pick(c, ["case_number", "caseNumber"]),
          title: pick(c, ["case_title", "caseTitle"], "Untitled Matter"),
          type: pick(c, ["case_type", "caseType"], "Uncategorized"),
          status: pick(c, ["status"], "Pending"),
          priority: pick(c, ["priority"], "Medium"),
          court: pick(c, ["court", "court_name"]),
          judge: pick(c, ["judge", "judge_name"]),
          opponent: pick(c, ["opponent", "opponent_name"]),
          description: pick(c, ["description", "case_description"], ""),
          aiSummary: extractAiSummary(item),
          client: clientName,
          hearingDate: hearingRaw ? formatDate(hearingRaw) : null,
        };
      });
    }, [cases]);

    const filtered = useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return normalized;
      return normalized.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          String(c.number).toLowerCase().includes(q) ||
          c.client.toLowerCase().includes(q)
      );
    }, [normalized, search]);

    const selectedCase =
      normalized.find((c) => c.id === selectedId) || filtered[0] || normalized[0] || null;

    const today = new Date();

    const upcomingHearings = useMemo(() => {
      return normalized
        .filter((c) => c.hearingDate && c.hearingDate >= new Date(today.toDateString()))
        .sort((a, b) => a.hearingDate - b.hearingDate)
        .slice(0, 5);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [normalized]);

    const todaysHearings = upcomingHearings.filter((c) => isSameDay(c.hearingDate, today));

    const highPriorityCount = normalized.filter(
      (c) => c.priority?.toLowerCase() === "high"
    ).length;

    const uniqueClients = new Set(
      normalized.map((c) => c.client).filter((c) => c && c !== "—")
    ).size;

    const stats = [
      { label: "Active Cases", value: normalized.length, icon: "📁" },
      { label: "Today's Hearings", value: todaysHearings.length, icon: "📅" },
      { label: "High Priority", value: highPriorityCount, icon: "⚑" },
      { label: "Clients", value: uniqueClients, icon: "👤" },
    ];

    const logout = () => {
      localStorage.removeItem("advocate");
      navigate("/login");
    };

    return (
      <div className="ad-root">
        {/* ================= HEADER ================= */}
        <header className="ad-topbar">
          <div className="ad-topbar-left">
            <div className="ad-logo-mark">⚖</div>
            <div>
              <h1>Law Case Management System</h1>
            </div>
          </div>

          <div className="ad-topbar-right">
            <div className="ad-welcome">
              <span>Welcome</span>
              <h3>{advocate.full_name || "Advocate"}</h3>
            </div>
            <button className="ad-btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <div className="ad-body-wrap">
          {/* ================= SIDEBAR ================= */}
          <aside className="ad-sidebar">
            <div className="ad-sidebar-card">
              <div className="ad-sidebar-title">Navigation</div>

              <nav className="ad-nav">
                <div className="ad-nav-item active">🏠 Dashboard</div>
                <div className="ad-nav-item" onClick={() => navigate("/advocate/new-case")}>
                  ➕ New Case
                </div>
                <div className="ad-nav-item" onClick={() => navigate("/advocate/my-cases")}>
                  📂 My Cases
                </div>
                {/* <div className="ad-nav-item" onClick={() => navigate("/advocate/cause-list")}>
                  📅 Cause List
                </div> */}
                <div className="ad-nav-item" onClick={() => navigate("/advocate/documents")}>
                  📄 Document Vault
                </div>
                <div className="ad-nav-item" onClick={() => navigate("/advocate/analysis")}>
                  🤖 AI Analysis
                </div>
                <div className="ad-nav-item" onClick={() => navigate("/advocate/analytics")}>
                  📊 Analytics
                </div>
                <div className="ad-nav-item" onClick={() => navigate("/advocate/profile")}>
                  👤 Profile
                </div>
                {/* <div className="ad-nav-item" onClick={() => navigate("/advocate/settings")}>
                  ⚙ Settings
                </div> */}
              </nav>
            </div>

            <div className="ad-sidebar-card ad-profile-card">
              <div className="ad-avatar-sm">{initials(advocate.full_name)}</div>
              <div className="ad-who">
                <b>{advocate.full_name || "Advocate"}</b>
                <span>{advocate.email || "—"}</span>
                <span>Bar No: {advocate.bar_number || "—"}</span>
              </div>
            </div>
          </aside>

          {/* ================= MAIN ================= */}
          <main className="ad-main">
            <div className="ad-content">
              <div className="ad-greet-row">
                <div>
                  <span className="ad-eyebrow">Overview</span>
                  <h2>Dashboard</h2>
                </div>
                <button className="ad-btn-primary" onClick={() => navigate("/advocate/new-case")}>
                  ➕ New Case
                </button>
              </div>

              {/* ================= SEARCH ================= */}
              <div className="ad-search-card">
                <label className="ad-search-label">Search Case</label>
                <div className="ad-search-row">
                  <input
                    type="text"
                    placeholder="Search by case no, client or title…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* ================= STATS ================= */}
              <div className="ad-stat-row">
                {stats.map((s) => (
                  <div className="ad-stat-card" key={s.label}>
                    <div className="ad-stat-icon">{s.icon}</div>
                    <div className="ad-num">{loading ? "—" : s.value}</div>
                    <div className="ad-lbl">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ================= QUICK ACTIONS ================= */}
              <div className="ad-quick-actions">
                <div className="ad-quick-card" onClick={() => navigate("/advocate/new-case")}>
                  <div className="ad-quick-icon">➕</div>
                  <h3>New Case</h3>
                  <p>Create a new legal case</p>
                </div>
                <div className="ad-quick-card" onClick={() => navigate("/advocate/my-cases")}>
                  <div className="ad-quick-icon">📂</div>
                  <h3>My Cases</h3>
                  <p>Open all registered cases</p>
                </div>
                <div className="ad-quick-card" onClick={() => navigate("/advocate/documents")}>
                  <div className="ad-quick-icon">📄</div>
                  <h3>Upload PDF</h3>
                  <p>Upload legal documents</p>
                </div>
                <div className="ad-quick-card" onClick={() => navigate("/advocate/analysis")}>
                  <div className="ad-quick-icon">🤖</div>
                  <h3>AI Analysis</h3>
                  <p>Analyze case documents</p>
                </div>
              </div>

              {/* ================= GRID ================= */}
              <div className="ad-grid-2">
                <div>
                  {/* ================= CASE LIST ================= */}
                  <div className="ad-panel">
                    <div className="ad-panel-head">
                      <h2>Cases</h2>
                      <span className="ad-tag">{loading ? "…" : filtered.length}</span>
                    </div>

                    {loading ? (
                      <div className="ad-panel-state">Loading cases…</div>
                    ) : error ? (
                      <div className="ad-panel-state">
                        Couldn't load cases.{" "}
                        <button className="ad-retry" onClick={fetchCases}>
                          Retry
                        </button>
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="ad-panel-state">
                        {cases.length === 0
                          ? "No cases have been filed yet."
                          : "No cases match this search."}
                      </div>
                    ) : (
                      filtered.map((item) => (
                        <div
                          key={item.id}
                          className={`ad-case-row ${
                            selectedCase?.id === item.id ? "selected" : ""
                          }`}
                          data-type={item.type}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <div className="ad-case-tab" />

                          <div className="ad-case-info">
                            <div className="ad-case-num">{item.number}</div>
                            <div className="ad-case-title">{item.title}</div>
                            <div className="ad-case-sub">{item.client}</div>
                            {item.court !== "—" && (
                              <div className="ad-case-sub">{item.court}</div>
                            )}
                          </div>

                          <div className={`ad-status-tag ad-status--${item.status.toLowerCase()}`}>
                            {item.status}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ================= HEARINGS ================= */}
                  <div className="ad-panel">
                    <div className="ad-panel-head">
                      <h2>Upcoming Hearings</h2>
                    </div>

                    {loading ? (
                      <div className="ad-panel-state">Loading…</div>
                    ) : upcomingHearings.length === 0 ? (
                      <div className="ad-panel-state">No upcoming hearings scheduled.</div>
                    ) : (
                      upcomingHearings.map((item) => (
                        <div key={item.id} className="ad-cause-item">
                          <div className="ad-cause-date">
                            <strong>
                              {isSameDay(item.hearingDate, today)
                                ? "Today"
                                : item.hearingDate.toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                            </strong>
                          </div>

                          <div className="ad-cause-info">
                            <div className="ad-cause-title">{item.title}</div>
                            <div className="ad-cause-meta">
                              {item.court !== "—" ? item.court : "Court not set"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ================= CASE FILE PANEL ================= */}
                <div className="ad-panel">
                  <div className="ad-panel-head">
                    <h2>Case File</h2>
                  </div>

                  {loading ? (
                    <div className="ad-panel-state">Loading…</div>
                  ) : !selectedCase ? (
                    <div className="ad-panel-state">Select a case to see its details.</div>
                  ) : (
                    <div className="ad-insight-body">
                      <span className="ad-insight-tab" data-type={selectedCase.type}>
                        {selectedCase.type}
                      </span>

                      <h3 className="ad-insight-case">{selectedCase.title}</h3>
                      <p className="ad-insight-num">{selectedCase.number}</p>

                      <div className="ad-detail-grid">
                        <div>
                          <span>Client</span>
                          <strong>{selectedCase.client}</strong>
                        </div>
                        <div>
                          <span>Status</span>
                          <strong>{selectedCase.status}</strong>
                        </div>
                        <div>
                          <span>Priority</span>
                          <strong>{selectedCase.priority}</strong>
                        </div>
                        <div>
                          <span>Court</span>
                          <strong>{selectedCase.court}</strong>
                        </div>
                        <div>
                          <span>Judge</span>
                          <strong>{selectedCase.judge}</strong>
                        </div>
                        <div>
                          <span>Opponent</span>
                          <strong>{selectedCase.opponent}</strong>
                        </div>
                        <div>
                          <span>Next Hearing</span>
                          <strong>
                            {selectedCase.hearingDate
                              ? selectedCase.hearingDate.toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </strong>
                        </div>
                      </div>

                      {selectedCase.description && (
                        <>
                          <div className="ad-sub-head">Description</div>
                          <div className="ad-precedent">{selectedCase.description}</div>
                        </>
                      )}

                      <div className="ad-sub-head">AI Analysis</div>
                      {selectedCase.aiSummary ? (
                        <div className="ad-ai-summary">{selectedCase.aiSummary}</div>
                      ) : (
                        <div className="ad-ai-empty">
                          No AI analysis yet. It will appear here once the case PDF has been
                          processed.
                        </div>
                      )}

                      <button
                        className="ad-btn-primary ad-full-width"
                        onClick={() => navigate(`/advocate/case/${selectedCase.id}`)}
                      >
                        Open Complete Case →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }