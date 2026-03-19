import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from "./routes/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server running on : http://localhost:${PORT}`);
});