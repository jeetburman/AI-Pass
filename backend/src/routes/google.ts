import { Router, Request, Response, NextFunction } from "express";
import passport from "../config/passport";
import jwt from "jsonwebtoken";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", { session: false }, (err: Error, user: { id: string; email: string }) => {
      if (err) {
        console.error("Passport error:", err);
        return res.redirect(
          `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/login?error=oauth_failed`
        );
      }
      if (!user) {
        console.error("No user returned from Google");
        return res.redirect(
          `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/login?error=oauth_failed`
        );
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      const params = new URLSearchParams({
        token,
        userId: user.id,
        email: user.email,
      });

      res.redirect(
        `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/auth/callback?${params}`
      );
    })(req, res, next);
  }
);

export default router;