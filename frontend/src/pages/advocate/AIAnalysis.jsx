import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaBalanceScale,
  FaRobot,
  FaCopy,
  FaCheck,
  FaVolumeUp,
  FaVolumeMute,
  FaHistory,
  FaTimes,
} from "react-icons/fa";
import API from "../../api/axios";
import "./AIAnalysis.css";

export default function AIAnalysis() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const suggestions = [
    "IPC Section 420",
    "IPC Section 302",
    "What is Bail?",
    "What is FIR?",
    "Cheque Bounce",
    "Cyber Crime",
    "Divorce Law",
    "Consumer Protection Act",
    "Motor Vehicle Act",
    "Property Dispute",
  ];

  const relatedQuestions = [
    { title: "IPC 420", desc: "Cheating and dishonestly inducing delivery of property.", q: "What is IPC Section 420?" },
    { title: "Anticipatory Bail", desc: "Protection from arrest before being taken into custody.", q: "What is Anticipatory Bail?" },
    { title: "FIR", desc: "First Information Report under criminal procedure.", q: "What is FIR?" },
    { title: "Consumer Act", desc: "Rights of consumers and complaint procedures.", q: "Consumer Protection Act" },
    { title: "Cyber Crime", desc: "IT Act offences, hacking and online fraud.", q: "Cyber Crime Laws" },
    { title: "Divorce Law", desc: "Grounds and procedure for divorce in India.", q: "Divorce Procedure in India" },
  ];

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handleSearch = async (searchText = query) => {
    if (!searchText.trim()) {
      alert("Please enter a legal question.");
      return;
    }

    stopSpeaking();
    setCopied(false);

    try {
      setLoading(true);

      const res = await API.post("/ai-search/", {
    query: searchText,
    });

      setAnswer(res.data.answer);

      setHistory((prev) => {
        const updated = [searchText, ...prev.filter((item) => item !== searchText)];
        return updated.slice(0, 8);
      });
    } catch (err) {
      console.log(err);
      setAnswer("Unable to fetch AI response. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const copyAnswer = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const speakAnswer = () => {
    if (!answer) return;

    if (speaking) {
      stopSpeaking();
      return;
    }

    const speech = new SpeechSynthesisUtterance(answer);
    speech.lang = "en-IN";
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => setSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
    setSpeaking(true);
  };

  const newSearch = () => {
    stopSpeaking();
    setQuery("");
    setAnswer("");
  };

  return (
    <div className="ai-page">
      {/* Header */}
      <header className="ai-header">
        <button className="ai-back-btn" onClick={() => navigate("/advocate/dashboard")}>
          <FaArrowLeft />
          Dashboard
        </button>

        <div>
          <span className="ai-eyebrow">Research Chamber</span>
          <h1>
            <FaBalanceScale /> AI Legal Assistant
          </h1>
          <p>Search any Indian legal section, Act, judgment or legal question.</p>
        </div>
      </header>

      {/* Search */}
      <div className="ai-search-card">
        <div className="ai-search-box">
          <input
            type="text"
            placeholder="Search legal question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button onClick={() => handleSearch()}>
            <FaSearch />
            Search
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="ai-suggestions">
        <h3>Popular Searches</h3>

        <div className="ai-chip-container">
          {suggestions.map((item) => (
            <button
              key={item}
              className={`ai-chip ${query === item ? "is-active" : ""}`}
              onClick={() => {
                setQuery(item);
                handleSearch(item);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="ai-loading">
          <div className="ai-spinner" />
          <p>AI is analysing your question…</p>
        </div>
      )}

      {/* AI Answer */}
      {!loading && answer && (
        <div className="ai-answer-card">
          <div className="ai-answer-header">
            <h2>
              <FaRobot /> AI Response
            </h2>

            <div className="ai-actions">
              <button onClick={copyAnswer}>
                {copied ? <FaCheck /> : <FaCopy />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={speakAnswer} className={speaking ? "is-speaking" : ""}>
                {speaking ? <FaVolumeMute /> : <FaVolumeUp />}
                {speaking ? "Stop" : "Speak"}
              </button>
              <button onClick={newSearch} className="ai-new-btn">
                <FaTimes />
                New Search
              </button>
            </div>
          </div>

          <div className="ai-answer-body">
            {answer.split("\n").map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {history.length > 0 && (
        <div className="ai-history">
          <h3>
            <FaHistory /> Recent Searches
          </h3>

          <div className="ai-history-list">
            {history.map((item, index) => (
              <button
                key={index}
                className="ai-history-item"
                onClick={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Questions */}
      <div className="ai-related">
        <h3>Frequently Asked Questions</h3>

        <div className="ai-related-grid">
          {relatedQuestions.map((item) => (
            <div
              key={item.title}
              className="ai-related-card"
              onClick={() => {
                setQuery(item.q);
                handleSearch(item.q);
              }}
            >
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="ai-footer">
        <h3>
          <FaBalanceScale /> Legal AI Assistant
        </h3>

        <p>
          This AI assistant helps advocates quickly understand Indian laws,
          IPC/BNS sections, legal procedures, case references, and legal
          terminology.
        </p>

        <p className="ai-disclaimer">
          <strong>Disclaimer:</strong> AI-generated answers are for educational
          and research purposes only. Always verify legal advice using official
          Bare Acts, Supreme Court judgments, High Court judgments, and other
          authentic legal sources before using it in any legal proceeding.
        </p>
      </div>
    </div>
  );
}