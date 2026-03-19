import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { runAI } from "../services/ai";

const router = Router();


router.use(authenticate);

// GET /tasks — list all tasks for the logged-in user
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      include: { result: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /tasks — create a new task
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, taskType, inputText } = req.body;

  if (!title || !taskType || !inputText) {
    res.status(400).json({ error: "title, taskType, and inputText are required" });
    return;
  }

  const validTypes = ["summarize", "classify_risk", "extract_info"];
  if (!validTypes.includes(taskType)) {
    res.status(400).json({ error: `taskType must be one of: ${validTypes.join(", ")}` });
    return;
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        taskType,
        inputText,
        userId: req.userId!,
        status: "pending",
      },
    });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tasks/stats — usage summary for dashboard
router.get("/stats", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, completed, pending, running, byType] = await Promise.all([
      prisma.task.count({ where: { userId: req.userId } }),
      prisma.task.count({ where: { userId: req.userId, status: "completed" } }),
      prisma.task.count({ where: { userId: req.userId, status: "pending" } }),
      prisma.task.count({ where: { userId: req.userId, status: "running" } }),
      prisma.task.groupBy({
        by: ["taskType"],
        where: { userId: req.userId },
        _count: { taskType: true },
      }),
    ]);

    res.json({
      total,
      completed,
      pending,
      running,
      byType: byType.map((t) => ({
        taskType: t.taskType,
        count: t._count.taskType,
      })),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tasks/:id
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const task = await prisma.task.findFirst({
      where: { id, userId: req.userId },
      include: { result: true },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json(task);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});



// POST /tasks/:id/run
router.post("/:id/run", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const task = await prisma.task.findFirst({
      where: { id, userId: req.userId },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (task.status === "completed") {
      res.status(400).json({ error: "Task already completed" });
      return;
    }

    // Mark as running
    await prisma.task.update({
    where: { id: task.id },
    data: { status: "running" },
    });

    // Run AI logic — now awaited
    const aiResult = await runAI(task.taskType, task.inputText);

    // Save result and mark completed
    const result = await prisma.taskResult.create({
      data: {
        taskId: task.id,
        resultText: aiResult.resultText,
        resultJson: aiResult.resultJson,
      },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "completed" },
    });

    res.json({ task: { ...task, status: "completed" }, result });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});



export default router;