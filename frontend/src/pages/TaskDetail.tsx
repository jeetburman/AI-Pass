import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tasksApi } from "../api/client";
import type { Task } from "../types";
import Navbar from "../components/Navbar";
import "../styles/createTask.css";
import "../styles/taskDetail.css";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTaskType(type: string) {
  return type.replace(/_/g, " ");
}

function DecisionBadge({ decision }: { decision: string }) {
  return (
    <span className={`decision-badge ${decision}`}>
      {decision}
    </span>
  );
}

function ResultJson({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="json-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide" : "Show"} raw JSON
      </button>
      {open && (
        <pre className="json-block">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await tasksApi.getOne(id!);
        setTask(res.data);
      } catch {
        setError("Task not found or failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleRun() {
    if (!task) return;
    setRunning(true);
    setRunError(null);
    try {
      const res = await tasksApi.run(task.id);
      setTask({ ...res.data.task, result: res.data.result });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to run task. Please try again.";
      setRunError(message);
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <main className="page-content">
          <div className="loading-state">Loading task...</div>
        </main>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="page">
        <main className="page-content">
          <div className="page-header">
            <button className="btn-back" onClick={() => navigate("/dashboard")}>
              ← Back
            </button>
          </div>
          <div className="error-banner">{error ?? "Task not found."}</div>
        </main>
      </div>
    );
  }

  const resultJson = task.result?.resultJson as Record<string, unknown> | undefined;
  const reasons = resultJson?.reasons as string[] | undefined;
  const confidence = resultJson?.confidence as number | undefined;
  const decision = resultJson?.decision as string | undefined;

  return (
    <div className="page">
      <Navbar />
      <main className="page-content">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <h1>Task detail</h1>
        </div>

        {/* Task info card */}
        <div className="task-detail-card">
          <div className="task-detail-header">
            <div>
              <div className="task-detail-title">{task.title}</div>
              <div className="task-detail-meta">
                <span className="task-type-badge">
                  {formatTaskType(task.taskType)}
                </span>
                <span className="task-date">{formatDate(task.createdAt)}</span>
              </div>
            </div>
            <div className="task-detail-status">
              <span className={`status-badge ${task.status}`}>
                {task.status}
              </span>
            </div>
          </div>

          {/* Input text */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div className="section-label">Input text</div>
            <div className="input-text-box">{task.inputText}</div>
          </div>

          {/* Run section */}
          {task.status !== "completed" && (
            <div className="run-section">
              {running ? (
                <div className="running-indicator">
                  <div className="spinner" />
                  Running AI analysis...
                </div>
              ) : (
                <span className="run-hint">
                  Click to run AI analysis on this task
                </span>
              )}
              {runError && (
                <div className="error-banner" style={{ margin: 0 }}>
                  {runError}
                </div>
              )}
              <button
                className={`btn-run ${running ? "running" : ""}`}
                onClick={handleRun}
                disabled={running}
              >
                {running ? "Running..." : "▶ Run task"}
              </button>
            </div>
          )}
        </div>

        {/* Result card */}
        {task.result && (
          <div className="result-card">
            <div className="result-header">
              <h2>Analysis result</h2>
              <span className="result-timestamp">
                {formatDate(task.result.createdAt)}
              </span>
            </div>

            {/* Result text */}
            <div className="section-label">Summary</div>
            <div className="result-text-box">{task.result.resultText}</div>

            {/* Decision + confidence */}
            {decision && (
              <div className="decision-row">
                <DecisionBadge decision={decision} />
                {confidence !== undefined && (
                  <div className="confidence-row">
                    <span className="confidence-label">Confidence</span>
                    <div className="confidence-track">
                      <div
                        className="confidence-fill"
                        style={{ width: `${confidence * 100}%` }}
                      />
                    </div>
                    <span className="confidence-value">
                      {Math.round(confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Reasons */}
            {reasons && reasons.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div className="section-label">Reasons</div>
                <ul className="reasons-list">
                  {reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw JSON */}
            <div>
              <div className="section-label">Structured output</div>
              <ResultJson data={task.result.resultJson as Record<string, unknown>} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}