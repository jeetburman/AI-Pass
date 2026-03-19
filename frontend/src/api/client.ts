import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (email: string, password: string) =>
    api.post("/auth/register", { email, password }),
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
};

export const tasksApi = {
  getAll: () => api.get("/tasks"),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  create: (data: { title: string; taskType: string; inputText: string }) =>
    api.post("/tasks", data),
  run: (id: string) => api.post(`/tasks/${id}/run`),
  getStats: () => api.get("/tasks/stats"),
};