import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userId = params.get("userId");
    const email = params.get("email");

    if (token && userId && email) {
      login({ id: userId, email }, token);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        color: "var(--text-secondary)",
        fontSize: "0.95rem",
      }}
    >
      Signing you in...
    </div>
  );
}