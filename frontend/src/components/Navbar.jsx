import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-brand-700">
          AI Resume Reviewer
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {isAuthenticated ? (
            <>
              <Link to="/upload" className="text-gray-600 hover:text-brand-600">Upload</Link>
              <Link to="/history" className="text-gray-600 hover:text-brand-600">History</Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-brand-600">Log in</Link>
              <Link to="/register" className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
