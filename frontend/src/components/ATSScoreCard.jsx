export default function ATSScoreCard({ analysis }) {
  const categories = [
    ["Skills", analysis.category_scores.skills],
    ["Format", analysis.category_scores.format],
    ["Experience", analysis.category_scores.experience],
    ["Grammar", analysis.category_scores.grammar],
    ["Keywords", analysis.category_scores.keywords],
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-2xl font-bold text-brand-700">
          {analysis.overall_score}
        </div>
        <div>
          <p className="text-sm text-gray-500">Overall ATS Score</p>
          <p className="text-lg font-medium text-gray-900">out of 100</p>
        </div>
      </div>

      <div className="space-y-2">
        {categories.map(([label, score]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-24 text-sm text-gray-600">{label}</span>
            <div className="h-2 flex-1 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="w-8 text-right text-sm text-gray-500">{score}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-medium text-green-700">Strengths</p>
          <ul className="list-inside list-disc text-sm text-gray-600">
            {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-amber-700">Weaknesses</p>
          <ul className="list-inside list-disc text-sm text-gray-600">
            {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      </div>

      {analysis.missing_keywords?.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-gray-700">Missing keywords</p>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_keywords.map((k, i) => (
              <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
