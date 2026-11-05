import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaBalanceScale,
  FaUserTie,
  FaSearch,
  FaSignOutAlt,
  FaGavel,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaFolderOpen,
  FaChevronRight,
  FaUsers,
  FaTimes,
  FaAward,
  FaTrophy,
  FaRupeeSign,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";

import API from "../../api/axios";
import "./ClientDashboard.css";

// Deterministic accent color for an advocate's avatar, derived from their name
const AVATAR_PALETTE = ["#651A22", "#8A4A2C", "#3D5A5B", "#4A5568", "#7A5C1E"];
const avatarColor = (name = "") => {
  const sum = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};
const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

// Languages offered for the AI summary/case story — same set as the
// advocate's Summary page.
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "gu", label: "ગુજરાતી" },
];

async function translateText(text, lang, signal) {
  if (!text || !text.trim() || lang === "en") return text;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(
    text
  )}`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);

  const data = await response.json();
  return data[0].map((chunk) => chunk[0]).join("");
}

// Renders a string, list, or key/value object coming back from the AI
// analysis without needing a different component for each field.
function FlexibleList({ value, emptyText = "Not available yet." }) {
  if (value === null || value === undefined) {
    return <p className="hint">{emptyText}</p>;
  }

  if (typeof value === "string") {
    return value.trim() ? (
      <p className="analysis-text-block">{value}</p>
    ) : (
      <p className="hint">{emptyText}</p>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="hint">{emptyText}</p>;
    return (
      <ul className="analysis-flex-list">
        {value.map((entry, i) => (
          <li key={i}>
            {typeof entry === "string"
              ? entry
              : Object.entries(entry)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" · ")}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v);
    if (entries.length === 0) return <p className="hint">{emptyText}</p>;
    return (
      <dl className="analysis-kv-list">
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className="hint">{emptyText}</p>;
}

// Normalizes a case status string into a badge tone
const statusTone = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("close") || s.includes("dispos") || s.includes("resolv")) return "closed";
  if (s.includes("pending") || s.includes("review")) return "pending";
  if (s.includes("adjourn") || s.includes("stay")) return "hold";
  return "active";
};

function ClientDashboard() {
  const client = JSON.parse(localStorage.getItem("client"));

  const [advocates, setAdvocates] = useState([]);
  const [loadingAdvocates, setLoadingAdvocates] = useState(true);
  const [showAllAdvocates, setShowAllAdvocates] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);

  const [caseNumber, setCaseNumber] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Translation of the AI summary / case story
  const [activeLang, setActiveLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");
  const translationCache = useRef({}); // { en: {summary, case_story}, hi: {...}, ... }
  const translateAbort = useRef(null);

  useEffect(() => {
    loadAdvocates();
    return () => translateAbort.current?.abort();
  }, []);

  const filteredAdvocates = useMemo(() => {
    const q = search.toLowerCase();
    return advocates.filter(
      (advocate) =>
        advocate.full_name.toLowerCase().includes(q) ||
        advocate.bar_number.toLowerCase().includes(q)
    );
  }, [search, advocates]);

  const loadAdvocates = async () => {
    setLoadingAdvocates(true);
    try {
      const response = await API.get("client/advocates/");
      setAdvocates(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingAdvocates(false);
    }
  };

  const selectAdvocate = (advocate) => {
    setSelectedAdvocate(advocate);
    setCaseData(null);
    setAnalysis(null);
    setSearchError("");
    translateAbort.current?.abort();
    translationCache.current = {};
    setActiveLang("en");
    setTranslateError("");
  };

  const searchCase = async () => {
    setSearchError("");

    if (!selectedAdvocate) {
      setSearchError("Select an advocate before searching a case.");
      return;
    }
    if (!caseNumber.trim()) {
      setSearchError("Enter a case number to search.");
      return;
    }

    setSearching(true);
    setCaseData(null);
    setAnalysis(null);

    try {
      const response = await API.post("client/search-case/", {
        advocate_id: selectedAdvocate.id,
        case_number: caseNumber.trim(),
        client_email: client.email,
      });
      setCaseData(response.data);

      const newAnalysis = response.data.case?.analysis || null;
      setAnalysis(newAnalysis);

      // Reset translation state for the new case.
      translateAbort.current?.abort();
      setActiveLang("en");
      setTranslateError("");
      translationCache.current = newAnalysis
        ? {
            en: {
              summary: newAnalysis.summary,
              case_story: newAnalysis.case_story,
            },
          }
        : {};
    } catch {
      setSearchError("No case found for this number under the selected advocate.");
    } finally {
      setSearching(false);
    }
  };

  const switchLanguage = useCallback(
    async (lang) => {
      if (!analysis || lang === activeLang || translating) return;

      setTranslateError("");

      if (translationCache.current[lang]) {
        setActiveLang(lang);
        return;
      }

      translateAbort.current?.abort();
      const controller = new AbortController();
      translateAbort.current = controller;

      const previousLang = activeLang;

      try {
        setTranslating(true);
        setActiveLang(lang);

        const [summary, case_story] = await Promise.all([
          translateText(analysis.summary, lang, controller.signal),
          translateText(analysis.case_story, lang, controller.signal),
        ]);

        translationCache.current[lang] = { summary, case_story };
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Translation error:", err);
          setTranslateError("Couldn't translate this summary. Please try again.");
          setActiveLang(previousLang);
        }
      } finally {
        setTranslating(false);
      }
    },
    [analysis, activeLang, translating]
  );

  const logout = () => {
    localStorage.removeItem("client");
    window.location.href = "/";
  };

  return (
    <div className="client-dashboard">
      {/* Navbar */}
      <div className="navbar">
        <div className="logo">
          <FaBalanceScale />
          <div>
            <h2>Law Case Management System</h2>
            {/* <span className="logo-sub">Client Portal</span> */}
          </div>
        </div>

        <div className="user">
          <button className="view-all-advocates-btn" onClick={() => setShowAllAdvocates(true)}>
            <FaUsers />
            View All Advocates
          </button>

          <div className="user-chip">
            <span className="user-avatar">{initials(client?.full_name) || "C"}</span>
            <span>
              Welcome, <b>{client?.full_name}</b>
            </span>
          </div>
          <button onClick={logout}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </div>

      {showAllAdvocates && (
        <div className="advocates-modal-overlay" onClick={() => setShowAllAdvocates(false)}>
          <div className="advocates-modal" onClick={(e) => e.stopPropagation()}>
            <div className="advocates-modal-header">
              <h2>
                <FaUsers /> All Registered Advocates
              </h2>
              <button className="advocates-modal-close" onClick={() => setShowAllAdvocates(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="advocates-modal-body">
              {loadingAdvocates && <p className="hint">Loading advocates…</p>}

              {!loadingAdvocates && advocates.length === 0 && (
                <p className="hint">No advocates registered yet.</p>
              )}

              {!loadingAdvocates &&
                advocates.map((advocate) => (
                  <div className="advocate-detail-card" key={advocate.id}>
                    <span
                      className="avatar lg"
                      style={{ background: avatarColor(advocate.full_name) }}
                    >
                      {initials(advocate.full_name)}
                    </span>

                    <div className="advocate-detail-info">
                      <h3>{advocate.full_name}</h3>

                      {advocate.specialization && (
                        <p className="advocate-specialization">{advocate.specialization}</p>
                      )}

                      <div className="advocate-detail-grid">
                        <span>
                          <FaBalanceScale /> Bar No. ****{advocate.bar_number.slice(-4)}
                        </span>
                        <span>
                          <FaAward /> {advocate.experience_years || 0} yrs experience
                        </span>
                        <span>
                          <FaTrophy /> {advocate.cases_won || 0} cases won
                        </span>
                        <span>
                          <FaRupeeSign /> {advocate.case_fees || "Not specified"}
                        </span>
                        <span>
                          <FaEnvelope /> {advocate.email}
                        </span>
                        <span>
                          <FaPhoneAlt /> {advocate.phone}
                        </span>
                      </div>
                    </div>

                    <button
                      className="advocate-select-btn"
                      onClick={() => {
                        selectAdvocate(advocate);
                        setShowAllAdvocates(false);
                      }}
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-container">
        {/* Left Panel */}
        <div className="advocate-section">
          <div className="panel-header">
            <h2>
              <FaUserTie />
              Registered Advocates
            </h2>
            <span className="count-pill">{advocates.length}</span>
          </div>

          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or bar number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="advocate-scroll">
            {loadingAdvocates &&
              Array.from({ length: 4 }).map((_, i) => (
                <div className="advocate-card skeleton" key={i}>
                  <div className="skel-avatar" />
                  <div className="skel-lines">
                    <div className="skel-line w-70" />
                    <div className="skel-line w-40" />
                  </div>
                </div>
              ))}

            {!loadingAdvocates && filteredAdvocates.length === 0 && (
              <div className="empty-state">
                <FaFolderOpen />
                <h3>No advocate found</h3>
                <p>Try a different name or bar number.</p>
              </div>
            )}

            {!loadingAdvocates &&
              filteredAdvocates.map((advocate) => (
                <div
                  key={advocate.id}
                  className={`advocate-card ${
                    selectedAdvocate?.id === advocate.id ? "active" : ""
                  }`}
                  onClick={() => selectAdvocate(advocate)}
                >
                  <span
                    className="avatar"
                    style={{ background: avatarColor(advocate.full_name) }}
                  >
                    {initials(advocate.full_name)}
                  </span>

                  <div className="advocate-info">
                    <h3>{advocate.full_name}</h3>
                    <p className="bar-no">
                      Bar No · ****{advocate.bar_number.slice(-4)}
                    </p>
                  </div>

                  <FaChevronRight className="chevron" />
                </div>
              ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="case-section">
          <h2 className="section-title">Selected Advocate</h2>

          {selectedAdvocate ? (
            <div className="selected-card">
              <span
                className="avatar lg"
                style={{ background: avatarColor(selectedAdvocate.full_name) }}
              >
                {initials(selectedAdvocate.full_name)}
              </span>
              <div>
                <h3>{selectedAdvocate.full_name}</h3>
                <p>
                  <strong>Bar Number:</strong> ****
                  {selectedAdvocate.bar_number.slice(-4)}
                </p>
                <p className="hint">Enter a case number below to view case details.</p>
              </div>
            </div>
          ) : (
            <div className="selected-card empty">
              <FaUserTie className="placeholder-icon" />
              <div>
                <h3>No advocate selected</h3>
                <p>Choose a registered advocate from the left panel to begin.</p>
              </div>
            </div>
          )}

          <h2 className="section-title">Search Case</h2>

          <div className="case-search-row">
            <input
              type="text"
              placeholder="Enter case number"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchCase()}
            />
            <button className="search-btn" onClick={searchCase} disabled={searching}>
              <FaSearch />
              {searching ? "Searching..." : "Search Case"}
            </button>
          </div>

          {searchError && <div className="inline-error">{searchError}</div>}

          {caseData && (
            <div className="case-details">
              <div className="case-details-header">
                <h2>
                  <FaGavel /> Case Details
                </h2>
                <span className={`status-badge ${statusTone(caseData.status)}`}>
                  {caseData.status}
                </span>
              </div>

              <div className="detail-grid">
                <div className="detail-box">
                  <span className="detail-label">Case Number</span>
                  <span className="detail-value mono">{caseData.case_number}</span>
                </div>
                <div className="detail-box">
                  <span className="detail-label">
                    <FaMapMarkerAlt /> Court
                  </span>
                  <span className="detail-value">{caseData.court}</span>
                </div>
                <div className="detail-box">
                  <span className="detail-label">
                    <FaCalendarAlt /> Next Hearing
                  </span>
                  <span className="detail-value">{caseData.next_hearing}</span>
                </div>
              </div>

              <h3>Case History</h3>

              {caseData.history && caseData.history.length > 0 ? (
                <ul className="timeline">
                  {caseData.history.map((item, index) => (
                    <li key={index}>
                      <span className="timeline-dot" />
                      <span className="timeline-text">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">No history recorded for this case yet.</p>
              )}

              <div className="analysis-block">
                <div className="analysis-header">
                  <h3> Summary</h3>
                  {analysis?.ai_confidence != null && (
                    <span className="confidence-pill">
                      {analysis.ai_confidence}% confidence
                    </span>
                  )}
                </div>

                {!analysis ? (
                  <p className="hint">
                    This case hasn't been analyzed yet, or analysis is still
                    processing.
                  </p>
                ) : (
                  <>
                    <div className="language-buttons" role="group" aria-label="Translate summary">
                      {LANGUAGES.map(({ code, label }) => (
                        <button
                          key={code}
                          type="button"
                          className={`lang-btn ${activeLang === code ? "active" : ""}`}
                          onClick={() => switchLanguage(code)}
                          disabled={translating}
                          aria-pressed={activeLang === code}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {translateError && (
                      <div className="inline-error">{translateError}</div>
                    )}

                    <h4 className="analysis-subhead">Executive Summary</h4>
                    {translating ? (
                      <p className="hint">Translating…</p>
                    ) : (
                      <FlexibleList
                        value={translationCache.current[activeLang]?.summary}
                        emptyText="No summary generated."
                      />
                    )}

                    <h4 className="analysis-subhead">Full Case Story</h4>
                    {translating ? (
                      <p className="hint">Translating…</p>
                    ) : (
                      <FlexibleList
                        value={translationCache.current[activeLang]?.case_story}
                        emptyText="No narrative generated."
                      />
                    )}

                    <h4 className="analysis-subhead">Parties</h4>
                    <FlexibleList
                      value={analysis.parties}
                      emptyText="No parties extracted."
                    />

                    <h4 className="analysis-subhead">Important Dates</h4>
                    <FlexibleList
                      value={analysis.important_dates}
                      emptyText="No dates extracted."
                    />

                    <h4 className="analysis-subhead">Applicable Acts</h4>
                    <FlexibleList
                      value={analysis.acts}
                      emptyText="No acts identified."
                    />

                    <h4 className="analysis-subhead">Sections</h4>
                    <FlexibleList
                      value={analysis.sections}
                      emptyText="No sections identified."
                    />

                    <h4 className="analysis-subhead">Evidence</h4>
                    <FlexibleList
                      value={analysis.evidence}
                      emptyText="No evidence listed."
                    />

                    <h4 className="analysis-subhead">Missing Documents</h4>
                    <FlexibleList
                      value={analysis.missing_documents}
                      emptyText="Nothing flagged as missing."
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;