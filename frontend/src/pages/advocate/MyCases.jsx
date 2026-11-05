import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import API from "../../api/axios";
import "./MyCases.css";

const TYPE_ORDER = [
  "Criminal",
  "Civil",
  "Family",
  "Property",
  "Consumer",
  "Labour",
];

export default function MyCases() {

  const navigate = useNavigate();

  const advocate = JSON.parse(
    localStorage.getItem("advocate")
  );

  const [cases, setCases] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeType, setActiveType] =
    useState("All");

  const [query, setQuery] =
    useState("");

  const [completingId, setCompletingId] =
    useState(null);

  useEffect(() => {

    fetchCases();

  }, []);

  const fetchCases = async () => {

    try {

      if (!advocate) {

        alert("Please login first.");

        navigate("/advocate");

        return;

      }

      const response = await API.get(
        `/cases/all/?advocate_id=${advocate.id}`
      );

      setCases(response.data);

    }

    catch (error) {

      console.log(error);

      alert("Failed to load cases.");

    }

    finally {

      setLoading(false);

    }

  };

  const markAsCompleted = async (caseId, e) => {

    // Stop the click from bubbling to the folder card, which
    // would navigate into the case detail page instead.
    e.stopPropagation();

    try {

      setCompletingId(caseId);

      await API.put(
        `/cases/${caseId}/edit/?advocate_id=${advocate.id}`,
        { status: "Completed" }
      );

      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? { ...c, status: "Completed" }
            : c
        )
      );

    }

    catch (error) {

      console.log(error);

      alert("Failed to update case status.");

    }

    finally {

      setCompletingId(null);

    }

  };

  const normalizedType = (type) => {

    if (
      !type ||
      type.toLowerCase() === "na" ||
      type.toLowerCase() === "n/a"
    ) {
      return "Uncategorized";
    }

    return (
      type.charAt(0).toUpperCase() +
      type.slice(1).toLowerCase()
    );

  };

  const types = useMemo(() => {

    const found = new Set(
      cases.map((c) =>
        normalizedType(c.case_type)
      )
    );

    return [

      "All",

      ...TYPE_ORDER.filter((t) =>
        found.has(t)
      ),

      ...[...found].filter(
        (t) => !TYPE_ORDER.includes(t)
      ),

    ];

  }, [cases]);

  const filtered = useMemo(() => {

    return cases.filter((c) => {

      const type = normalizedType(
        c.case_type
      );

      const matchesType =
        activeType === "All" ||
        type === activeType;

      const q = query
        .trim()
        .toLowerCase();

      const matchesQuery =
        !q ||
        c.case_title
          ?.toLowerCase()
          .includes(q) ||
        c.client?.full_name
          ?.toLowerCase()
          .includes(q) ||
        String(c.case_number)
          .toLowerCase()
          .includes(q);

      return (
        matchesType &&
        matchesQuery
      );

    });

  }, [cases, activeType, query]);

  return (

    <div className="mc-page">

      <header className="mc-header">

        <div className="mc-header-text">

          <button
            className="mc-back-btn"
            onClick={() =>
              navigate("/advocate/dashboard")
            }
          >

            <FaArrowLeft />

            Back to Dashboard

          </button>

          <span className="mc-eyebrow">

            Case Docket

          </span>

          <h1>

            My Cases

          </h1>

          <p>

            {loading

              ? "Loading Cases..."

              : `${filtered.length} of ${cases.length} case${
                  cases.length === 1
                    ? ""
                    : "s"
                } found`}

          </p>

        </div>

        <div className="mc-controls">

          <div className="mc-search">

            <svg
              viewBox="0 0 20 20"
              fill="none"
            >

              <circle
                cx="9"
                cy="9"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />

              <path
                d="M14 14L18 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />

            </svg>

            <input
              type="text"
              placeholder="Search Case..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />

          </div>

          <div className="mc-filters">

            {types.map((type) => (

              <button
                key={type}
                className={`mc-filter-pill ${
                  activeType === type
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  setActiveType(type)
                }
              >

                {type}

              </button>

            ))}

          </div>

        </div>

      </header>
            {loading ? (

        <div className="mc-state">

          <div className="mc-state-mark" />

          <p>Loading your cases...</p>

        </div>

      ) : filtered.length === 0 ? (

        <div className="mc-state">

          <div className="mc-state-mark mc-state-mark--empty" />

          <p>

            {cases.length === 0
              ? "No cases found."
              : "No matching case found."}

          </p>

          {cases.length > 0 && (

            <button
              className="mc-reset-btn"
              onClick={() => {

                setActiveType("All");

                setQuery("");

              }}
            >

              Clear Filters

            </button>

          )}

        </div>

      ) : (

        <div className="mc-grid">

          {filtered.map((item) => {

            const type = normalizedType(item.case_type);

            const status = (
              item.status || "Pending"
            ).toLowerCase();

            return (

              <div
                key={item.id}
                className="mc-folder"
                data-type={type}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(
                    `/advocate/case/${item.id}?advocate_id=${advocate.id}`
                  )
                }
                onKeyDown={(e) => {

                  if (e.key === "Enter") {

                    navigate(
                      `/advocate/case/${item.id}?advocate_id=${advocate.id}`
                    );

                  }

                }}
              >

                <div className="mc-tab">

                  <span>

                    {type}

                  </span>

                </div>

                <div
                  className={`mc-stamp mc-stamp--${status}`}
                >

                  {status}

                </div>

                <div className="mc-folder-body">

                  <h3>

                    {item.case_title ||
                      "Untitled Case"}

                  </h3>

                  <dl className="mc-meta">

                    <div>

                      <dt>

                        Client

                      </dt>

                      <dd>

                        {item.client?.full_name ||
                          "-"}

                      </dd>

                    </div>

                    <div>

                      <dt>

                        Case No.

                      </dt>

                      <dd className="mc-docket">

                        {item.case_number}

                      </dd>

                    </div>

                    <div>

                      <dt>

                        Court

                      </dt>

                      <dd>

                        {item.court_name}

                      </dd>

                    </div>

                    <div>

                      <dt>

                        Priority

                      </dt>

                      <dd>

                        {item.priority}

                      </dd>

                    </div>

                  </dl>

                </div>

                <div className="mc-folder-footer">

                  <span>

                    Open Case

                  </span>

                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                  >

                    <path
                      d="M4 8H12M12 8L8.5 4.5M12 8L8.5 11.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                  </svg>

                </div>

                {status === "pending" && (

                  <button
                    className="mc-complete-btn"
                    disabled={completingId === item.id}
                    onClick={(e) =>
                      markAsCompleted(item.id, e)
                    }
                  >

                    {completingId === item.id
                      ? "Updating..."
                      : "Complete Case"}

                  </button>

                )}

              </div>

            );

          })}

        </div>

      )}

    </div>

  );

}