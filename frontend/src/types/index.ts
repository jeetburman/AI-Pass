export type User = {
  id: string;
  email: string;
}

export type TaskResult = {
  id: string;
  resultText: string;
  resultJson: Record<string, unknown>;
  createdAt: string;
  taskId: string;
}

export type Task = {
  id: string;
  title: string;
  taskType: string;
  inputText: string;
  status: "pending" | "running" | "completed";
  createdAt: string;
  userId: string;
  result?: TaskResult;
}

export type Stats = {
  total: number;
  completed: number;
  pending: number;
  running: number;
  byType: { taskType: string; count: number }[];
}