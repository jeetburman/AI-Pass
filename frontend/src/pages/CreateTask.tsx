import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tasksApi } from "../api/client";
import "../styles/createTask.css";
import Navbar from "../components/Navbar";

const TASK_TYPES = [
  {
    value: "summarize",
    label: "Summarize",
    icon: "📝",
    desc: "Condense long text into key points",
  },
  {
    value: "classify_risk",
    label: "Classify risk",
    icon: "🔍",
    desc: "Detect risk level in contracts or content",
  },
  {
    value: "extract_info",
    label: "Extract info",
    icon: "📤",
    desc: "Pull emails, dates, names and more",
  },
];

interface FormState {
  title: string;
  taskType: string;
  inputText: string;
}

interface FormErrors {
  title?: string;
  taskType?: string;
  inputText?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = "Title is required";
  else if (form.title.trim().length < 3)
    errors.title = "Title must be at least 3 characters";
  if (!form.taskType) errors.taskType = "Please select a task type";
  if (!form.inputText.trim()) errors.inputText = "Input text is required";
  else if (form.inputText.trim().length < 10)
    errors.inputText = "Input text must be at least 10 characters";
  return errors;
}

export default function CreateTask() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    title: "",
    taskType: "",
    inputText: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setApiError(null);
  }

  function selectTaskType(value: string) {
    setForm((prev) => ({ ...prev, taskType: value }));
    setErrors((prev) => ({ ...prev, taskType: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const res = await tasksApi.create({
        title: form.title.trim(),
        taskType: form.taskType,
        inputText: form.inputText.trim(),
      });
      navigate(`/tasks/${res.data.id}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to create task. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <h1>Create new task</h1>
        </div>

        <div className="create-card">
          {apiError && (
            <div className="form-error-banner">{apiError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Task title</label>
              <input
                className={`form-input ${errors.title ? "error" : ""}`}
                type="text"
                name="title"
                placeholder="e.g. Summarize Q3 report"
                value={form.title}
                onChange={handleChange}
              />
              {errors.title && (
                <span className="form-error">{errors.title}</span>
              )}
            </div>

            {/* Task type */}
            <div className="form-group">
              <label className="form-label">Task type</label>
              <div className="task-type-grid">
                {TASK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`task-type-option ${
                      form.taskType === t.value ? "selected" : ""
                    }`}
                    onClick={() => selectTaskType(t.value)}
                  >
                    <div className="task-type-icon">{t.icon}</div>
                    <div className="task-type-name">{t.label}</div>
                    <div className="task-type-desc">{t.desc}</div>
                  </button>
                ))}
              </div>
              {errors.taskType && (
                <span className="form-error">{errors.taskType}</span>
              )}
            </div>

            {/* Input text */}
            <div className="form-group">
              <label className="form-label">Input text</label>
              <textarea
                className={`form-textarea ${errors.inputText ? "error" : ""}`}
                name="inputText"
                placeholder="Paste the text you want to analyse..."
                value={form.inputText}
                onChange={handleChange}
              />
              {errors.inputText ? (
                <span className="form-error">{errors.inputText}</span>
              ) : (
                <span className="form-hint">
                  {form.inputText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create task"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}