import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function useTheme() {
  const getTheme = () =>
    (localStorage.getItem("theme") as "light" | "dark") ?? "light";

  function toggle() {
    const next = getTheme() === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return { theme: getTheme(), toggle };
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span
        className="navbar-brand"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/dashboard")}
      >
        AI-Pass
      </span>
      <div className="navbar-right">
        <span className="navbar-email">{user?.email}</span>
        <button className="theme-toggle" onClick={toggle}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}