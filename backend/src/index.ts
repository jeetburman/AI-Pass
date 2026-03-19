import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from "./routes/auth";
import taskRouter from "./routes/tasks";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL ?? "",
  ],
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use("/auth", authRouter);
app.use("/tasks", taskRouter);

app.listen(PORT, () => {
  console.log(`Server running on : http://localhost:${PORT}`);
});