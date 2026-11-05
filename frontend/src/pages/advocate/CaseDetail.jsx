import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../api/axios";
import "./CaseDetail.css";

const TYPE_TAB = {
  Civil: "Civil",
  Criminal: "Criminal",
  Family: "Family",
  Property: "Property",
  Consumer: "Consumer",
  Labour: "Labour",
};

const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["Pending", "Active", "Closed"];

// Derive the file-server origin from the API baseURL
const API_ORIGIN = (API.defaults.baseURL || "").replace(/\/api\/?$/, "");

function fileUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
}

function normalizeType(type) {
  if (!type) return "Uncategorized";
  const clean = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return TYPE_TAB[clean] || "Uncategorized";
}

function FlexibleList({ value, emptyText = "Not available yet." }) {
  if (value === null || value === undefined) {
    return <p className="cd-empty-note">{emptyText}</p>;
  }

  if (typeof value === "string") {
    return value.trim() ? <p className="cd-text-block">{value}</p> : (
      <p className="cd-empty-note">{emptyText}</p>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="cd-empty-note">{emptyText}</p>;
    return (
      <ul className="cd-flex-list">
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
    const entries = Object.entries(value);
    if (entries.length === 0) return <p className="cd-empty-note">{emptyText}</p>;
    return (
      <dl className="cd-kv-list">
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <p className="cd-empty-note">{emptyText}</p>;
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const advocate = JSON.parse(localStorage.getItem("advocate")) || {};

  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Case updates (log)
  const [newNote, setNewNote] = useState("");
  const [addingUpdate, setAddingUpdate] = useState(false);

  // Add document
  const [newDoc, setNewDoc] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (!advocate.id) {
      alert("Please login first.");
      navigate("/advocate");
      return;
    }
    fetchCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCase = async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await API.get(`/cases/${id}/?advocate_id=${advocate.id}`);

      const data = res.data?.case || res.data;
      setCaseItem(data);
    } catch (err) {
      console.log(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const deleteCase = async () => {
    if (!window.confirm("Delete this case permanently? This cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await API.delete(`/cases/delete/${id}/?advocate_id=${advocate.id}`);
      navigate("/advocate/my-cases");
    } catch (err) {
      console.log(err);
      alert("Failed to delete case.");
    } finally {
      setDeleting(false);
    }
  };

  // ===== Edit case details =====

  const startEdit = () => {
    setEditForm({
      court_name: caseItem.court_name || "",
      judge_name: caseItem.judge_name || "",
      opponent_name: caseItem.opponent_name || "",
      hearing_date: caseItem.hearing_date || "",
      priority: caseItem.priority || "Medium",
      status: caseItem.status || "Pending",
      description: caseItem.description || "",
    });
    setEditMode(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      const res = await API.put(
        `/cases/${id}/edit/?advocate_id=${advocate.id}`,
        editForm
      );
      setCaseItem(res.data.case || { ...caseItem, ...editForm });
      setEditMode(false);
    } catch (err) {
      console.log(err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // ===== Case updates (log) =====

  const addUpdate = async () => {
    if (!newNote.trim()) return;

    try {
      setAddingUpdate(true);
      const res = await API.post(
        `/cases/${id}/updates/?advocate_id=${advocate.id}`,
        { note: newNote.trim() }
      );

      setCaseItem((prev) => ({
        ...prev,
        updates: [res.data.update, ...(prev.updates || [])],
      }));
      setNewNote("");
    } catch (err) {
      console.log(err);
      alert("Failed to add update.");
    } finally {
      setAddingUpdate(false);
    }
  };

  // ===== Add document =====

  const uploadDoc = async () => {
    if (!newDoc) return;

    try {
      setUploadingDoc(true);
      const data = new FormData();
      data.append("pdf", newDoc);

      const res = await API.post(
        `/cases/${id}/documents/add/?advocate_id=${advocate.id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setCaseItem((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), res.data.document],
      }));
      setNewDoc(null);
    } catch (err) {
      console.log(err);
      alert("Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-state">
          <span className="cd-state-mark" />
          Retrieving case file…
        </div>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="cd-page">
        <div className="cd-state">
          <p>Couldn't load this case. It may have been removed, or doesn't belong to your account.</p>
          <div className="cd-state-actions">
            <button className="cd-retry" onClick={fetchCase}>Retry</button>
            <button className="cd-back-btn" onClick={() => navigate("/advocate/my-cases")}>
              ← Back to My Cases
            </button>
          </div>
        </div>
      </div>
    );
  }

  const type = normalizeType(caseItem.case_type);
  const status = (caseItem.status || "Pending").toLowerCase();
  const analysis = caseItem.analysis;
  const documents = caseItem.documents || [];
  const updates = caseItem.updates || [];
  const client = caseItem.client;

  return (
    <div className="cd-page">
      <div className="cd-topbar">
        <button className="cd-back-btn" onClick={() => navigate("/advocate/my-cases")}>
          ← Back to My Cases
        </button>
        <button className="cd-delete-btn" onClick={deleteCase} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete Case"}
        </button>
      </div>

      {/* ===== LETTERHEAD ===== */}
      <div className="cd-letterhead">
        <div className="cd-letterhead-top">
          <span className="cd-tab" data-type={type}>{type}</span>
          <span className={`cd-stamp cd-stamp--${status}`}>{status}</span>
        </div>

        <h1>{caseItem.case_title || "Untitled Case"}</h1>

        <div className="cd-letterhead-meta">
          <span>
            Docket No. <strong className="mono">{caseItem.case_number}</strong>
          </span>
          <span className="cd-dot">•</span>
          <span>
            Priority <strong>{caseItem.priority || "Medium"}</strong>
          </span>
          <span className="cd-dot">•</span>
          <span>
            Filed{" "}
            <strong>
              {caseItem.created_at
                ? new Date(caseItem.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </strong>
          </span>
        </div>
      </div>

      <div className="cd-grid">
        {/* ===== LEFT COLUMN ===== */}
        <div className="cd-col">
          <section className="cd-card">
            <h2>Client</h2>
            <dl className="cd-kv-list">
              <div>
                <dt>Full Name</dt>
                <dd>{client?.full_name || "—"}</dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>{client?.mobile || "—"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{client?.email || "—"}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{client?.address || "—"}</dd>
              </div>
            </dl>
          </section>

          {/* ===== CASE INFORMATION (editable) ===== */}
          <section className="cd-card">
            <div className="cd-card-head">
              <h2>Case Information</h2>
              {!editMode ? (
                <button className="cd-edit-btn" onClick={startEdit}>
                  Edit
                </button>
              ) : (
                <div className="cd-edit-actions">
                  <button className="cd-save-btn" onClick={saveEdit} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button className="cd-cancel-btn" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {!editMode ? (
              <>
                <dl className="cd-kv-list">
                  <div>
                    <dt>Court</dt>
                    <dd>{caseItem.court_name || "—"}</dd>
                  </div>
                  <div>
                    <dt>Judge</dt>
                    <dd>{caseItem.judge_name || "—"}</dd>
                  </div>
                  <div>
                    <dt>Opponent</dt>
                    <dd>{caseItem.opponent_name || "—"}</dd>
                  </div>
                  <div>
                    <dt>Next Hearing</dt>
                    <dd>
                      {caseItem.hearing_date
                        ? new Date(caseItem.hearing_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </dd>
                  </div>
                </dl>

                {caseItem.description && (
                  <>
                    <h3 className="cd-subhead">Description</h3>
                    <p className="cd-text-block">{caseItem.description}</p>
                  </>
                )}
              </>
            ) : (
              <div className="cd-edit-form">
                <label>
                  <span>Court</span>
                  <input
                    name="court_name"
                    value={editForm.court_name}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  <span>Judge</span>
                  <input
                    name="judge_name"
                    value={editForm.judge_name}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  <span>Opponent</span>
                  <input
                    name="opponent_name"
                    value={editForm.opponent_name}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  <span>Next Hearing</span>
                  <input
                    type="date"
                    name="hearing_date"
                    value={editForm.hearing_date || ""}
                    onChange={handleEditChange}
                  />
                </label>
                <label>
                  <span>Priority</span>
                  <select name="priority" value={editForm.priority} onChange={handleEditChange}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select name="status" value={editForm.status} onChange={handleEditChange}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="cd-edit-full">
                  <span>Description</span>
                  <textarea
                    name="description"
                    rows="4"
                    value={editForm.description}
                    onChange={handleEditChange}
                  />
                </label>
              </div>
            )}
          </section>

          {/* ===== DOCUMENTS (with add) ===== */}
          <section className="cd-card">
            <h2>Documents</h2>
            {documents.length === 0 ? (
              <p className="cd-empty-note">No documents uploaded.</p>
            ) : (
              <ul className="cd-doc-list">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <span className="cd-doc-icon">PDF</span>
                    <div className="cd-doc-meta">
                      <a href={fileUrl(doc.pdf)} target="_blank" rel="noreferrer">
                        {doc.pdf?.split("/").pop() || `Document #${doc.id}`}
                      </a>
                      <span>
                        {doc.uploaded_at
                          ? new Date(doc.uploaded_at).toLocaleDateString("en-IN")
                          : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="cd-add-doc">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setNewDoc(e.target.files[0] || null)}
              />
              <button
                className="cd-add-btn"
                onClick={uploadDoc}
                disabled={!newDoc || uploadingDoc}
              >
                {uploadingDoc ? "Uploading…" : "Add Document"}
              </button>
            </div>
          </section>

          {/* ===== CASE UPDATES (log) ===== */}
          <section className="cd-card">
            <h2>Case Updates</h2>

            <div className="cd-add-update">
              <textarea
                rows="3"
                placeholder="Log what happened — e.g. 'Hearing adjourned to 14 Aug', 'Filed additional evidence'…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button
                className="cd-add-btn"
                onClick={addUpdate}
                disabled={!newNote.trim() || addingUpdate}
              >
                {addingUpdate ? "Adding…" : "Add Update"}
              </button>
            </div>

            {updates.length === 0 ? (
              <p className="cd-empty-note">No updates logged yet.</p>
            ) : (
              <ul className="cd-update-list">
                {updates.map((u) => (
                  <li key={u.id}>
                    <span className="cd-update-dot" />
                    <div>
                      <p>{u.note}</p>
                      <span className="cd-update-date">
                        {new Date(u.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ===== RIGHT COLUMN — AI ANALY SIS ===== */}
        <div className="cd-col">
          <section className="cd-card cd-card--analysis">
            <div className="cd-analysis-head">
              <h2>AI Analysis</h2>
              {analysis?.ai_confidence != null && (
                <span className="cd-confidence">{analysis.ai_confidence}% confidence</span>
              )}
            </div>

            {!analysis ? (
              <p className="cd-empty-note">
                This case hasn't been analyzed yet, or analysis is still processing.
              </p>
            ) : (
              <>
                <h3 className="cd-subhead">Executive Summary</h3>
                <FlexibleList value={analysis.summary} emptyText="No summary generated." />

                <h3 className="cd-subhead">Case Story</h3>
                <FlexibleList value={analysis.case_story} emptyText="No narrative generated." />

                <h3 className="cd-subhead">Parties</h3>
                <FlexibleList value={analysis.parties} emptyText="No parties extracted." />

                <h3 className="cd-subhead">Important Dates</h3>
                <FlexibleList value={analysis.important_dates} emptyText="No dates extracted." />

                <h3 className="cd-subhead">Timeline</h3>
                <FlexibleList value={analysis.timeline} emptyText="No timeline available." />

                <h3 className="cd-subhead">Applicable Acts</h3>
                <FlexibleList value={analysis.acts} emptyText="No acts identified." />

                <h3 className="cd-subhead">Sections</h3>
                <FlexibleList value={analysis.sections} emptyText="No sections identified." />

                <h3 className="cd-subhead">Evidence</h3>
                <FlexibleList value={analysis.evidence} emptyText="No evidence listed." />

                <h3 className="cd-subhead">Missing Documents</h3>
                <FlexibleList
                  value={analysis.missing_documents}
                  emptyText="Nothing flagged as missing."
                />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}