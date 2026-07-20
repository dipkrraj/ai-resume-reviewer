import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF or DOCX file first.");
      return;
    }
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data: resume } = await client.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { data: analysis } = await client.post(`/resumes/${resume.id}/analyze`);
      navigate(`/analysis/${resume.id}/${analysis.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload/analysis failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Upload your resume</h1>
      <p className="mb-6 text-sm text-gray-600">PDF or DOCX, up to 5MB. Text-based files only — scanned images can't be parsed.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-brand-700 hover:file:bg-brand-100"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {uploading ? "Analyzing... this can take up to a minute" : "Upload & Analyze"}
        </button>
      </form>
    </div>
  );
}
