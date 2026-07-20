import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";

export default function History() {
  const [resumes, setResumes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null); // track resume id being analyzed
  const navigate = useNavigate();

  useEffect(() => {
    client
      .get("/resumes")
      .then(({ data }) => {
        setResumes(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load resume history.");
        setLoading(false);
      });
  }, []);

  const getLatestAnalysis = (resume) => {
    if (!resume.analyses || resume.analyses.length === 0) return null;
    return [...resume.analyses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  };

  const handleAnalyzeNow = async (resumeId) => {
    setAnalyzingId(resumeId);
    try {
      const { data: analysis } = await client.post(`/resumes/${resumeId}/analyze`);
      navigate(`/analysis/${resumeId}/${analysis.id}`);
    } catch (err) {
      setError("Analysis failed. Try again.");
      setAnalyzingId(null);
    }
  };

  const getGaugeColor = (score) => {
    if (score < 50) return "text-red-500 bg-red-50 border-red-100";
    if (score < 80) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };

  // Stats calculation
  const totalScans = resumes.length;
  const analyzedResumes = resumes.filter(r => r.analyses && r.analyses.length > 0);
  const latestScores = analyzedResumes.map(r => getLatestAnalysis(r)?.overall_score || 0);
  const avgScore = latestScores.length > 0 
    ? Math.round(latestScores.reduce((a, b) => a + b, 0) / latestScores.length) 
    : 0;
  const highestScore = latestScores.length > 0 ? Math.max(...latestScores) : 0;

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#f4f7fa] px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500"></div>
        <p className="mt-4 text-sm font-semibold text-gray-500">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans antialiased text-[#1f2937] py-10 px-4 md:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Header Title and Context */}
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            Resume History & Tracking
          </h1>
          <p className="text-sm font-semibold text-gray-500 max-w-2xl leading-relaxed">
            Manage your uploaded documents, track your ATS score progression over time as you refine bullet points, and jump directly back into detailed reports.
          </p>
        </div>

        {/* Summary Dashboard Statistics */}
        {totalScans > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition">
              <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Total Uploads</p>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-gray-800">{totalScans}</span>
                <span className="text-xs font-semibold text-gray-400">files</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition">
              <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Average ATS Score</p>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-brand-600">
                  {avgScore > 0 ? `${avgScore}%` : "—"}
                </span>
                {avgScore > 0 && <span className="text-xs font-semibold text-gray-400">overall</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition">
              <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Highest Score</p>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-black tracking-tight text-emerald-600">
                  {highestScore > 0 ? `${highestScore}%` : "—"}
                </span>
                {highestScore > 0 && <span className="text-xs font-semibold text-gray-400">achieved</span>}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600 text-center shadow-sm">
            {error}
          </div>
        )}

        {/* History Feed List */}
        {resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-2xl shadow-sm mb-4">
              📄
            </div>
            <h3 className="text-lg font-bold text-gray-800">No resumes scanned yet</h3>
            <p className="mt-1 text-sm font-semibold text-gray-400">
              Upload your first resume in PDF or DOCX format to receive structured ATS reports.
            </p>
            <Link
              to="/upload"
              className="mt-5 inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-100 hover:bg-brand-700 active:scale-95 transition"
            >
              Analyze Your Resume
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Scan Activity Log</h2>
              <Link 
                to="/upload" 
                className="text-xs font-bold text-brand-600 hover:text-brand-700 transition"
              >
                + Upload New Version
              </Link>
            </div>

            <div className="space-y-3">
              {resumes.map((r) => {
                const latestAnalysis = getLatestAnalysis(r);
                
                return (
                  <div 
                    key={r.id} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition"
                  >
                    {/* Left details */}
                    <div className="flex items-start space-x-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f8fafc] border border-gray-100 text-2xl shadow-inner">
                        {r.original_filename.toLowerCase().endsWith(".pdf") ? "📕" : "📘"}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-800 leading-snug break-all sm:break-normal max-w-md">
                          {r.original_filename}
                        </h3>
                        <p className="mt-1 text-[11px] font-semibold text-gray-400">
                          Uploaded {new Date(r.created_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Right actions and scores */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-gray-50 pt-3 sm:border-0 sm:pt-0">
                      {latestAnalysis ? (
                        <>
                          {/* Score Badge */}
                          <div className={`flex items-center space-x-1.5 rounded-xl border px-3.5 py-1.5 font-black text-sm shadow-sm ${getGaugeColor(latestAnalysis.overall_score)}`}>
                            <span>Score:</span>
                            <span>{latestAnalysis.overall_score}/100</span>
                          </div>
                          
                          <Link
                            to={`/analysis/${r.id}/${latestAnalysis.id}`}
                            className="rounded-xl border border-gray-200 bg-white px-4.5 py-2 text-xs font-bold text-gray-700 hover:border-brand-500 hover:text-brand-600 shadow-sm active:scale-95 transition"
                          >
                            View Report
                          </Link>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-gray-400 italic">Not Analyzed</span>
                          <button
                            onClick={() => handleAnalyzeNow(r.id)}
                            disabled={analyzingId === r.id}
                            className="rounded-xl bg-brand-600 px-4.5 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-sm active:scale-95 transition disabled:opacity-50"
                          >
                            {analyzingId === r.id ? "Analyzing..." : "Analyze Now"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
