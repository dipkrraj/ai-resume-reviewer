export default function InterviewQuestions({ questions, onGenerate, loading }) {
  const hasQuestions = questions?.easy?.length > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Interview Questions</h2>
        {!hasQuestions && (
          <button
            onClick={onGenerate}
            disabled={loading}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        )}
      </div>

      {!hasQuestions ? (
        <p className="text-sm text-gray-500">No questions generated yet.</p>
      ) : (
        <div className="space-y-4">
          {["easy", "medium", "hard"].map((level) => (
            <div key={level}>
              <p className="mb-1 text-sm font-medium capitalize text-gray-700">{level}</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                {questions[level].map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
