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
      </div>
    </div>
  );
}