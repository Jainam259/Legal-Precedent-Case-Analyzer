import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import API from "../../api/axios";
import "./NewCase.css";

const CASE_TYPES = ["Civil", "Criminal", "Family", "Property", "Consumer", "Labour"];
const PRIORITIES = [
  { value: "High", hint: "Next hearing is close or stakes are high" },
  { value: "Medium", hint: "On track, standard attention" },
  { value: "Low", hint: "No immediate action needed" },
];

export default function NewCase() {

    const navigate = useNavigate();

    const advocate = JSON.parse(
        localStorage.getItem("advocate")
    );

    const [formData, setFormData] = useState({
        clientName: "",
        mobile: "",
        email: "",
        address: "",
        caseNumber: "",
        caseTitle: "",
        caseType: "Civil",
        court: "",
        judge: "",
        opponent: "",
        hearingDate: "",
        priority: "Medium",
        description: "",
    });

  const [pdfFile, setPdfFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const setField = (name, value) => setFormData((f) => ({ ...f, [name]: value }));

  const handlePdf = (e) => {
    if (e.target.files?.[0]) setPdfFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setPdfFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pdfFile) {
      alert("Please upload a PDF.");
      return;
    }

    const data = new FormData();

      Object.keys(formData).forEach((key) =>
          data.append(key, formData[key])
      );

      // Send logged-in advocate ID
      data.append(
          "advocate_id",
          advocate.id
      );

      // Upload PDF
      data.append(
          "pdf",
          pdfFile
      );

    try {
      setLoading(true);

      const res = await API.post("/cases/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const aiSummary =
        res.data.summary?.summary || res.data.summary || "No summary available.";

      navigate("/summary", {
        state: { summary: aiSummary, caseData: formData },
      });
    } catch (err) {
      console.error(err);
      if (err.response) {
        alert(JSON.stringify(err.response.data, null, 2));
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fileSizeLabel = (bytes) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="nc-page">
      <header className="nc-header">
        <button className="nc-back-btn" onClick={() => navigate("/advocate/dashboard")}>
          <FaArrowLeft />
          Back to Dashboard
        </button>
        <span className="nc-eyebrow">Case Intake</span>
        <h1>Open a New Case</h1>
        <p>Enter client and case details, then attach the case PDF for review.</p>
      </header>

      <form className="nc-layout" onSubmit={handleSubmit}>
        <div className="nc-form-col">
          {/* CLIENT INFORMATION */}
          <section className="nc-section" data-tab="client">
            <div className="nc-section-tab">
              <span>Client</span>
            </div>
            <div className="nc-section-body">
              <div className="nc-grid">
                <label className="nc-field">
                  <span>Client name</span>
                  <input
                    type="text"
                    name="clientName"
                    placeholder="e.g. Harshit Sharma"
                    value={formData.clientName}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="nc-field">
                  <span>Mobile number</span>
                  <input
                    type="text"
                    name="mobile"
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="nc-field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="client@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </label>

                <label className="nc-field">
                  <span>Address</span>
                  <input
                    type="text"
                    name="address"
                    placeholder="City, state"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* CASE INFORMATION */}
          <section className="nc-section" data-tab="case">
            <div className="nc-section-tab">
              <span>Case</span>
            </div>
            <div className="nc-section-body">
              <div className="nc-grid">
                <label className="nc-field">
                  <span>Case number</span>
                  <input
                    type="text"
                    name="caseNumber"
                    placeholder="e.g. 2026/CR/041"
                    value={formData.caseNumber}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="nc-field">
                  <span>Case title</span>
                  <input
                    type="text"
                    name="caseTitle"
                    placeholder="e.g. State vs. Sharma"
                    value={formData.caseTitle}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="nc-field">
                  <span>Court name</span>
                  <input
                    type="text"
                    name="court"
                    placeholder="e.g. District Court, Ahmedabad"
                    value={formData.court}
                    onChange={handleChange}
                  />
                </label>

                <label className="nc-field">
                  <span>Judge name</span>
                  <input
                    type="text"
                    name="judge"
                    placeholder="Presiding judge"
                    value={formData.judge}
                    onChange={handleChange}
                  />
                </label>

                <label className="nc-field">
                  <span>Opponent name</span>
                  <input
                    type="text"
                    name="opponent"
                    placeholder="Opposing party"
                    value={formData.opponent}
                    onChange={handleChange}
                  />
                </label>

                <label className="nc-field">
                  <span>Next hearing date</span>
                  <input
                    type="date"
                    name="hearingDate"
                    value={formData.hearingDate}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="nc-subfield">
                <span className="nc-subfield-label">Case type</span>
                <div className="nc-chip-row">
                  {CASE_TYPES.map((t) => (
                    <button
                      type="button"
                      key={t}
                      data-type={t}
                      className={`nc-chip nc-chip--type ${
                        formData.caseType === t ? "is-active" : ""
                      }`}
                      onClick={() => setField("caseType", t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="nc-subfield">
                <span className="nc-subfield-label">Priority</span>
                <div className="nc-chip-row">
                  {PRIORITIES.map((p) => (
                    <button
                      type="button"
                      key={p.value}
                      data-priority={p.value}
                      className={`nc-chip nc-chip--priority ${
                        formData.priority === p.value ? "is-active" : ""
                      }`}
                      onClick={() => setField("priority", p.value)}
                      title={p.hint}
                    >
                      {p.value}
                    </button>
                  ))}
                </div>
              </div>

              <label className="nc-field nc-field--full">
                <span>Case description</span>
                <textarea
                  rows="5"
                  name="description"
                  placeholder="Summarize the matter, key facts, and what's being sought…"
                  value={formData.description}
                  onChange={handleChange}
                />
              </label>
            </div>
          </section>

          {/* DOCUMENTS */}
          <section className="nc-section" data-tab="docs">
            <div className="nc-section-tab">
              <span>Documents</span>
            </div>
            <div className="nc-section-body">
              <label
                className={`nc-dropzone ${dragActive ? "is-active" : ""} ${
                  pdfFile ? "has-file" : ""
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <input type="file" accept=".pdf" onChange={handlePdf} hidden />

                {pdfFile ? (
                  <div className="nc-file-chip">
                    <div className="nc-file-icon">PDF</div>
                    <div className="nc-file-meta">
                      <strong>{pdfFile.name}</strong>
                      <span>{fileSizeLabel(pdfFile.size)} · click to replace</span>
                    </div>
                    <button
                      type="button"
                      className="nc-file-remove"
                      onClick={(e) => {
                        e.preventDefault();
                        setPdfFile(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="nc-dropzone-empty">
                    <div className="nc-dropzone-icon">⬆</div>
                    <strong>Drop the case PDF here, or click to browse</strong>
                    <span>PDF only, up to 20 MB</span>
                  </div>
                )}
              </label>
            </div>
          </section>

          <button type="submit" className="nc-save-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="nc-btn-spinner" /> Analyzing…
              </>
            ) : (
              "Save & Analyze"
            )}
          </button>
        </div>

        {/* LIVE PREVIEW */}
        <aside className="nc-preview-col">
          <div className="nc-preview-sticky">
            <span className="nc-preview-label">This is how it will appear in My Cases</span>

            <div className="nc-preview-folder" data-type={formData.caseType}>
              <div className="nc-preview-tab">
                <span>{formData.caseType || "Type"}</span>
              </div>

              <div className="nc-preview-stamp">Draft</div>

              <div className="nc-preview-body">
                <h3>{formData.caseTitle || "Untitled matter"}</h3>

                <dl>
                  <div>
                    <dt>Client</dt>
                    <dd>{formData.clientName || "—"}</dd>
                  </div>
                  <div>
                    <dt>Docket No.</dt>
                    <dd>{formData.caseNumber || "—"}</dd>
                  </div>
                  <div>
                    <dt>Hearing</dt>
                    <dd>
                      {formData.hearingDate
                        ? new Date(formData.hearingDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className={`nc-preview-priority nc-preview-priority--${formData.priority.toLowerCase()}`}>
                {formData.priority} priority
              </div>
            </div>

            <ul className="nc-checklist">
              <li className={formData.clientName ? "is-done" : ""}>Client details</li>
              <li className={formData.caseTitle && formData.caseNumber ? "is-done" : ""}>
                Case details
              </li>
              <li className={pdfFile ? "is-done" : ""}>Case PDF attached</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}