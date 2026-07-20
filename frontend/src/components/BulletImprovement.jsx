export default function BulletImprovement({ improvements, onGenerate, loading }) {
  const list = improvements?.improvements ?? [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Bullet Point Improvements</h2>
        {list.length === 0 && (
          <button
            onClick={onGenerate}
            disabled={loading}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500">No suggestions generated yet.</p>
      ) : (
        <div className="space-y-4">
          {list.map((item, i) => (
            <div key={i} className="rounded-md bg-gray-50 p-3">
              <p className="text-sm text-gray-400 line-through">{item.original}</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{item.improved}</p>
              <p className="mt-1 text-xs text-gray-500">{item.reasoning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
