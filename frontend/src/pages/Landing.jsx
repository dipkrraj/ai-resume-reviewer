import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="mx-auto mt-24 max-w-2xl px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900">AI Resume Reviewer</h1>
      <p className="mt-3 text-gray-600">
        Get an ATS score, improved bullet points, and tailored interview questions from your resume.
      </p>
      <Link
        to={isAuthenticated ? "/upload" : "/register"}
        className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-2.5 text-white hover:bg-brand-700"
      >
        {isAuthenticated ? "Upload a resume" : "Get started"}
      </Link>
    </div>
  );
}
