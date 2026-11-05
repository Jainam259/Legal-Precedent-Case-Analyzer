import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const CHAMBERS = {
  advocate: {
    key: "advocate",
    docket: "No. I",
    title: "Advocate",
    subtitle: "Enter as Legal Counsel",
    note: "Manage case files, submissions & hearings",
    path: "/advocate",
  },
  client: {
    key: "client",
    docket: "No. II",
    title: "Client",
    subtitle: "Enter as a Client",
    note: "Track your case status & correspondence",
    path: "/client",
  },
};

function Home() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(null);

  const handleEnter = (chamber) => {
    if (opening) return;

    setOpening(chamber.key);

    setTimeout(() => {
      navigate(chamber.path);
    }, 950);
  };

  return (
    <div className="home">
      {/* Header */}
      <header className="header">
        <h1>Law Case Management System</h1>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Architectural backdrop */}
        <div className="colonnade" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="colonnade__pillar" />
          ))}
        </div>

        <div className="motes" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className={`mote mote--${i + 1}`} />
          ))}
        </div>

        <p className="registry__eyebrow">Registry of Chambers</p>
        <h2 className="registry__lede">Select the file that matches your role</h2>

        <div className="registry">
          <div className="registry__desk">
            {["advocate", "client"].map((key) => {
              const chamber = CHAMBERS[key];
              const isSealed = opening === key;
              const isDimmed = opening && opening !== key;

              return (
                <button
                  key={key}
                  type="button"
                  aria-label={`${chamber.title} — ${chamber.subtitle}`}
                  className={`file-card file-card--${key} ${
                    isSealed ? "is-sealed" : ""
                  } ${isDimmed ? "is-dimmed" : ""}`}
                  onClick={() => handleEnter(chamber)}
                >
                  <span className="file-card__ribbon">{chamber.docket}</span>

                  <span className="file-card__body">
                    <span className="file-card__title">{chamber.title}</span>
                    <span className="file-card__rule" />
                    <span className="file-card__subtitle">{chamber.subtitle}</span>
                    <span className="file-card__note">{chamber.note}</span>
                  </span>

                  <span className="file-card__seal">
                    <span className="file-card__seal-ring" />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 2l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7z" />
                    </svg>
                    <span className="file-card__seal-burst" />
                  </span>

                  <span className="file-card__stamp">Entered</span>
                </button>
              );
            })}

            <div className="registry__divider" aria-hidden="true">
              <svg viewBox="0 0 40 160" preserveAspectRatio="none">
                <line x1="20" y1="4" x2="20" y2="156" className="registry__divider-line" />
              </svg>
              <span className="registry__scales">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M24 4v34M14 10h20M8 14l-6 12a6 6 0 0 0 12 0zM40 14l-6 12a6 6 0 0 0 12 0zM8 14l6-2M40 14l-6-2M16 44h16" />
                </svg>
              </span>
            </div>
          </div>

          {opening && (
            <p className="registry__status">
              Sealing entry to the {CHAMBERS[opening].title} Chamber…
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        © 2026 Law Case Management System | All Rights Reserved
      </footer>
    </div>
  );
}

export default Home;