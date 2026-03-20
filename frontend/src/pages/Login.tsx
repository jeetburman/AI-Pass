import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/client";
import "../styles/auth.css";

type Tab = "login" | "register";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(form: FormState, tab: Tab): FormErrors {
  const errors: FormErrors = {};

  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!form.password) {
    errors.password = "Password is required";
  } else if (tab === "register" && form.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (tab === "register" && form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("login");
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setApiError(null);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setErrors({});
    setApiError(null);
    setForm({ email: "", password: "", confirmPassword: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form, tab);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const res =
        tab === "login"
          ? await authApi.login(form.email, form.password)
          : await authApi.register(form.email, form.password);

      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Something went wrong. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">AI-Pass</div>
        <p className="auth-subtitle">AI-powered task analysis workspace</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => switchTab("login")}
          >
            Login
          </button>
          <button
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => switchTab("register")}
          >
            Register
          </button>
        </div>

        {apiError && <div className="auth-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className={`form-input ${errors.email ? "error" : ""}`}
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input ${errors.password ? "error" : ""}`}
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete={
                tab === "login" ? "current-password" : "new-password"
              }
            />
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          {tab === "register" && (
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                className={`form-input ${errors.confirmPassword ? "error" : ""}`}
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="form-error">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          <button className="btn-auth" type="submit" disabled={loading}>
            {loading
              ? tab === "login"
                ? "Logging in..."
                : "Creating account..."
              : tab === "login"
              ? "Login"
              : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          {tab === "login"
            ? "Don't have an account? Click Register above."
            : "Already have an account? Click Login above."}
        </p>
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or</span>
          <div className="auth-divider-line" />
        </div>
        <a href={`${import.meta.env.VITE_API_URL}/auth/google`}
          className="btn-google"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </a>
      </div>
    </div>
  );
}