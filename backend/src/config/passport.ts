import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL ?? "http://localhost:4000"}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0]?.value ?? `${profile.id}@google.com`;

        // find existing user or create one
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          const randomPassword = await bcrypt.hash(
            Math.random().toString(36),
            10
          );
          user = await prisma.user.create({
            data: {
              email,
              password: randomPassword,
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;