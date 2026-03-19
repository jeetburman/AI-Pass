import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tasksApi } from "../api/client";
import type { Task, Stats } from "../types";
import "../styles/dashboard.css";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") ?? "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTaskType(type: string) {
  return type.replace(/_/g, " ");
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [tasksRes, statsRes] = await Promise.all([
          tasksApi.getAll(),
          tasksApi.getStats(),
        ]);
        setTasks(tasksRes.data);
        setStats(statsRes.data);
      } catch {
        setError("Failed to load dashboard. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.inputText.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || t.taskType === filterType;
      const matchesStatus =
        filterStatus === "all" || t.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [tasks, search, filterType, filterStatus]);

  const maxCount = stats
    ? Math.max(...stats.byType.map((b) => b.count), 1)
    : 1;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">AI-Pass</span>
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

      <main className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Task Workspace</h1>
            <p>Manage and run your AI analysis tasks</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate("/tasks/new")}
          >
            + New Task
          </button>
        </div>

        {/* Error */}
        {error && <div className="error-banner">{error}</div>}

        {/* Stats */}
        {loading ? (
          <div className="stats-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-label">Total tasks</div>
                <div className="stat-card-value accent">{stats.total}</div>
                <div className="stat-card-sub">All time</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Completed</div>
                <div className="stat-card-value success">{stats.completed}</div>
                <div className="stat-card-sub">Successfully run</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Pending</div>
                <div className="stat-card-value warning">{stats.pending}</div>
                <div className="stat-card-sub">Awaiting execution</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Completion rate</div>
                <div className="stat-card-value accent">
                  {stats.total > 0
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0}
                  %
                </div>
                <div className="stat-card-sub">Of all tasks</div>
              </div>
            </div>

            {/* Analytics breakdown */}
            {stats.byType.length > 0 && (
              <div className="analytics-card">
                <h2>Usage by task type</h2>
                <div className="analytics-bars">
                  {stats.byType.map((b) => (
                    <div key={b.taskType} className="analytics-row">
                      <span className="analytics-label">
                        {formatTaskType(b.taskType)}
                      </span>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar-fill"
                          style={{
                            width: `${(b.count / maxCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="analytics-count">{b.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Task list */}
        <div className="tasks-section">
          <h2>Task history</h2>

          <div className="tasks-toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All types</option>
              <option value="summarize">Summarize</option>
              <option value="classify_risk">Classify risk</option>
              <option value="extract_info">Extract info</option>
            </select>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
            </select>
          </div>

          {loading ? (
            <div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <p>
                {tasks.length === 0
                  ? "No tasks yet. Create your first task to get started."
                  : "No tasks match your search or filters."}
              </p>
              {tasks.length === 0 && (
                <button
                  className="btn-primary"
                  onClick={() => navigate("/tasks/new")}
                >
                  + Create first task
                </button>
              )}
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="task-card"
                >
                  <div className="task-card-left">
                    <span className="task-card-title">{task.title}</span>
                    <div className="task-card-meta">
                      <span className="task-type-badge">
                        {formatTaskType(task.taskType)}
                      </span>
                      <span className="task-date">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="task-card-right">
                    <span className={`status-badge ${task.status}`}>
                      {task.status}
                    </span>
                    <span className="task-arrow">›</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}