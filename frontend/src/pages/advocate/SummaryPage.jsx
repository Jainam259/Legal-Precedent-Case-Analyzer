import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SummaryPage.css";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "gu", label: "ગુજરાતી" },
];

export default function SummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const originalSummary = location.state?.summary;
  const caseTitle = location.state?.title || "AI Case Summary";

  const [translatedSummary, setTranslatedSummary] = useState(originalSummary || "");
  const [activeLang, setActiveLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Cache translations per language so switching back is instant, no re-fetch.
  const cache = useRef({ en: originalSummary });
  const abortRef = useRef(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const translateText = useCallback(
    async (lang) => {
      if (!originalSummary || lang === activeLang || loading) return;

      setError(null);

      if (cache.current[lang]) {
        setActiveLang(lang);
        setTranslatedSummary(cache.current[lang]);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const previousLang = activeLang;

      try {
        setLoading(true);
        setActiveLang(lang);

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(
          originalSummary
        )}`;

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);

        const data = await response.json();
        const translated = data[0].map((chunk) => chunk[0]).join("");

        cache.current[lang] = translated;
        setTranslatedSummary(translated);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Translation Error:", err);
          setError("Couldn't translate this summary. Please try again.");
          setActiveLang(previousLang);
        }
      } finally {
        setLoading(false);
      }
    },
    [originalSummary, activeLang, loading]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([translatedSummary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `case-summary-${activeLang}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  const wordCount = translatedSummary
    ? translatedSummary.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (!originalSummary) {
    return (
      <div className="summary-page">
        <div className="summary-card empty-state">
          <span className="eyebrow">Research Chamber</span>
          <h2>No Summary Found</h2>
          <p className="empty-copy">
            There's no case summary to show yet. Generate one from the dashboard first.
          </p>
          <button className="back-btn" onClick={() => navigate("/advocate/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-page">
      <div className="summary-card">
        <div className="summary-header">
          <span className="eyebrow">Research Chamber</span>
          <div className="title-row">
            <span className="scale-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3v18M6 21h12M4 7l4-2 4 2M16 7l4-2 4 2M4 7l-3 6a3 3 0 006 0l-3-6zM20 7l-3 6a3 3 0 006 0l-3-6z" stroke="#c9a227" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <h1>{caseTitle}</h1>
          </div>
          <p className="summary-subtitle">
            AI-generated summary — verify against source documents before relying on it.
          </p>
        </div>

        <div className="language-buttons" role="group" aria-label="Translate summary">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              className={`lang-btn ${activeLang === code ? "active" : ""}`}
              onClick={() => translateText(code)}
              disabled={loading}
              aria-pressed={activeLang === code}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="summary-content" aria-live="polite" aria-busy={loading}>
          {loading ? (
            <div className="skeleton" aria-hidden="true">
              <span style={{ width: "92%" }}></span>
              <span style={{ width: "84%" }}></span>
              <span style={{ width: "97%" }}></span>
              <span style={{ width: "60%" }}></span>
            </div>
          ) : (
            translatedSummary
          )}
        </div>

        {!loading && (
          <div className="meta-row">
            <span>{wordCount} words</span>
            <span className="dot">•</span>
            <span>{LANGUAGES.find((l) => l.code === activeLang)?.label}</span>
          </div>
        )}

        <div className="action-row">
          <div className="action-group">
            <button className="action-btn" onClick={handleCopy} disabled={loading}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button className="action-btn" onClick={handleDownload} disabled={loading}>
              Download .txt
            </button>
            <button className="action-btn" onClick={handlePrint} disabled={loading}>
              Print
            </button>
          </div>
          <button className="back-btn" onClick={() => navigate(-2)}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}