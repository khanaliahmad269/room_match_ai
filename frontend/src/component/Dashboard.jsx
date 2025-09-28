import { useState } from "react";
import { Navbar } from "./Navbar";
import axios from "axios";
import { useAuth } from "../state/AuthContext";
import LoaderSearch from "./LoaderSearch";

export default function Dashboard() {
  const { auth, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]); // ✅ store search results

  const getScoreBadgeClass = (score) => {
    const scorePercent = score * 100;
    if (scorePercent >= 80) return 'bg-success';
    if (scorePercent >= 70) return 'bg-warning text-dark';
    return 'bg-info';
  };


  const handleSearch = async () => {
    try {
      const requestData = {
        query: search,
      };
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:8000/search", requestData);

      console.log("✅ Server Response:", res.data);
      setResults(res.data.results || []); // ✅ save results
      setLoading(false);
    } catch (err) {
      console.error("❌ Error sending search request:", err);
      alert("Failed to send search request.");
      setLoading(false);
    }
  };

  return (
    <>
     {loading ? <LoaderSearch/> : null}
      <Navbar />
      <div
        className="container-fluid min-vh-100 p-4"
        style={{
          background: "linear-gradient(135deg, #f9fafc 0%, #e8f0fe 100%)",
        }}
      >
        {/* Page Header */}
        <div className="text-center mb-5">
          <h2
            className="fw-bold"
            style={{
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            <i className="bi bi-speedometer2 me-2"></i>
            Roommate Dashboard
          </h2>
          <p className="text-muted">Set your preferences & find your match 🚀</p>
        </div>

        <div className="row g-4">
          {/* Panel */}
          <div className="col-md-12">
            <div
              className="card border-0 shadow-lg rounded-4"
            >
              <div className="card-body">
                <div className="input-group mb-3">
                  <span
                    className="input-group-text border-0"
                    style={{
                      background: "linear-gradient(135deg, #6a11cb, #2575fc)",
                      color: "white",
                    }}
                  >
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-control rounded-end-pill"
                    placeholder="Search..."
                  />
                </div>
                <button className="btn btn-primary mx-auto d-block" style={{ background: "linear-gradient(135deg, #6a11cb, #2575fc)" }} onClick={handleSearch}>Search</button>
                {/* Results Section */}
                <div className="mt-4">
                {results.length > 0 && (
        <div>
          <h5 className="fw-bold text-primary mb-3">
            <i className="bi bi-search me-2"></i>Search Results:
          </h5>
          <div className="row g-3">
            {results.map((item, idx) => {
              const scorePercent = (item.score * 100).toFixed(1);
              const badgeClass = getScoreBadgeClass(item.score);
              
              return (
                <div key={idx} className="col-lg-6 col-xl-4">
                  <div className="card result-card h-100 shadow-sm">
                    <div className="card-body position-relative">
                      {/* Profile Header */}
                      <div className="profile-header">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-1">
                              <i className="bi bi-geo-alt-fill me-2"></i>
                              {item.profile.area}, {item.profile.city}
                            </h6>
                            <small className="opacity-75">ID: {item.profile.id}</small>
                          </div>
                          <span className={`badge score-badge ${badgeClass}`}>
                            {scorePercent}%
                          </span>
                        </div>
                      </div>

                      {/* Profile Description */}
                      <div className="mb-3">
                        <p className="text-muted mb-0 fst-italic">
                          <i className="bi bi-chat-quote me-2"></i>
                          "{item.profile.raw_profile_text}"
                        </p>
                      </div>

                      {/* Profile Details */}
                      <div className="row g-3 mb-3">
                        <div className="col-6">
                          <div className="detail-item">
                          <i class="fa-solid fa-money-bill-wave"></i>
                            <span>
                              <strong>PKR {item.profile.budget_PKR?.toLocaleString() || 'N/A'}</strong>
                            </span>
                          </div>
                          <div className="detail-item">
                            <i class="fa-solid fa-broom"></i>
                            <span>{item.profile.cleanliness || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                          <i class="fa-solid fa-book-open"></i>
                            <span>{item.profile.study_habits || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="detail-item">
                          <i class="fa-solid fa-volume-high"></i>
                            <span>{item.profile.noise_tolerance || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                          <i class="fa-solid fa-utensils"></i>
                            <span>{item.profile.food_pref || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                          <i class="fa-solid fa-alarm-clock"></i>
                            <span>{item.profile.sleep_schedule || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Match Highlights */}
                      {item.similarity && (
                        <div className="similarity-box">
                          <div className="d-flex align-items-start">
                            <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                            <div>
                              <strong className="text-success">Match Highlights:</strong>
                              <div 
                                className="mt-1 small"
                                dangerouslySetInnerHTML={{ __html: item.similarity }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results State */}
      {results.length === 0 && !loading && (
        <div className="text-center mt-5 py-5">
          <i className="bi bi-search text-muted" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
          <h5 className="text-muted mt-3">No results yet</h5>
          <p className="text-muted">Try searching above 👆</p>
        </div>
      )}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
