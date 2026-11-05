import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import API from "../../api/axios";
import "./PdfLibrary.css";

// Derive the file-server origin from the API baseURL, same approach
// used on the Case Detail page.
const API_ORIGIN = (API.defaults.baseURL || "").replace(/\/api\/?$/, "");

function fileUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
}

function fileSizeLabel(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function PdfLibrary() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const advocate = JSON.parse(localStorage.getItem("advocate")) || {};

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [viewing, setViewing] = useState(null); // the doc currently open in the reader

  useEffect(() => {
    if (!advocate.id) {
      alert("Please login first.");
      navigate("/advocate");
      return;
    }
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/pdf-library/?advocate_id=${advocate.id}`);
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.log(err);
      alert("Failed to load your PDFs.");
    } finally {
      setLoading(false);
    }
  };

  const openPicker = () => fileInputRef.current?.click();

  const handleFileChosen = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please choose a PDF file.");
      return;
    }
    setPendingFile(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;

    try {
      setUploading(true);

      const data = new FormData();
      data.append("pdf", pendingFile);
      data.append("title", pendingFile.name);
      data.append("advocate_id", advocate.id);

      const res = await API.post(
        `/pdf-library/?advocate_id=${advocate.id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setDocuments((prev) => [res.data.document, ...prev]);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.log(err);
      alert("Failed to upload PDF.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Remove "${doc.title || "this PDF"}"?`)) return;

    try {
      await API.delete(`/pdf-library/${doc.id}/delete/?advocate_id=${advocate.id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      if (viewing?.id === doc.id) setViewing(null);
    } catch (err) {
      console.log(err);
      alert("Failed to delete PDF.");
    }
  };

  return (
    <div className="pl-page">
      {/* ================= TOP BAR ================= */}
      <div className="pl-topbar">
        <button className="pl-back-btn" onClick={() => navigate("/advocate/dashboard")}>
          <FaArrowLeft />
          Back to Dashboard
        </button>
      </div>

      {/* ================= HEADER / UPLOAD ================= */}
      <header className="pl-header">
        <div className="pl-header-text">
          <span className="pl-eyebrow">Document Vault</span>
          <h1>Upload PDF</h1>
          <p>Upload your PDFs here, then open any of them to read inline.</p>
        </div>

        <div className="pl-upload-box">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            hidden
            onChange={(e) => handleFileChosen(e.target.files?.[0])}
          />

          {!pendingFile ? (
            <button className="pl-upload-btn" onClick={openPicker}>
              + Upload PDF
            </button>
          ) : (
            <div className="pl-pending">
              <div className="pl-pending-info">
                <span className="pl-pending-icon">PDF</span>
                <div>
                  <strong>{pendingFile.name}</strong>
                  <span>{fileSizeLabel(pendingFile.size)}</span>
                </div>
              </div>

              <div className="pl-pending-actions">
                <button
                  className="pl-confirm-btn"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? "Uploading…" : "Confirm Upload"}
                </button>
                <button
                  className="pl-cancel-btn"
                  onClick={() => {
                    setPendingFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ================= PDF LIST ================= */}
      {loading ? (
        <div className="pl-state">
          <div className="pl-state-mark" />
          <p>Loading your PDFs…</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="pl-state">
          <div className="pl-state-mark pl-state-mark--empty" />
          <p>No PDFs uploaded yet.</p>
        </div>
      ) : (
        <div className="pl-grid">
          {documents.map((doc) => (
            <div key={doc.id} className="pl-card">
              <div className="pl-card-icon">PDF</div>

              <div className="pl-card-body">
                <h3>{doc.title || doc.pdf?.split("/").pop() || `Document #${doc.id}`}</h3>
                <span className="pl-card-date">
                  {doc.uploaded_at
                    ? new Date(doc.uploaded_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </span>
              </div>

              <div className="pl-card-actions">
                <button className="pl-read-btn" onClick={() => setViewing(doc)}>
                  Open &amp; Read
                </button>
                <a
                  className="pl-tab-link"
                  href={fileUrl(doc.pdf)}
                  target="_blank"
                  rel="noreferrer"
                >
                  New Tab
                </a>
                <button className="pl-delete-btn" onClick={() => handleDelete(doc)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= INLINE READER MODAL ================= */}
      {viewing && (
        <div className="pl-reader-overlay" onClick={() => setViewing(null)}>
          <div className="pl-reader" onClick={(e) => e.stopPropagation()}>
            <div className="pl-reader-head">
              <h3>{viewing.title || "Document"}</h3>
              <button className="pl-reader-close" onClick={() => setViewing(null)}>
                ✕
              </button>
            </div>
            <iframe
              className="pl-reader-frame"
              src={fileUrl(viewing.pdf)}
              title={viewing.title || "PDF"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
