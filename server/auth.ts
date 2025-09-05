import session from "express-session";
import type { Express } from "express";
import { storage } from "./storage";
import connectPg from "connect-pg-simple";

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function setupAuth(app: Express) {
  // Session configuration
  const PostgresSessionStore = connectPg(session);
  const sessionStore = new PostgresSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: 7 * 24 * 60 * 60, // 7 days
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Middleware to attach userId from session
  app.use((req, res, next) => {
    if (req.session && (req.session as any).userId) {
      req.userId = (req.session as any).userId;
    }
    next();
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Hybrid authentication that works with both Replit Auth and local auth
export function hybridAuth(req: any, res: any, next: any) {
  // For local auth, check session userId
  if (req.userId) {
    // Create a user object that mimics Replit Auth structure
    req.user = {
      claims: {
        sub: req.userId
      }
    };
    return next();
  }
  
  // If no local auth, return unauthorized
  res.status(401).json({ message: "Unauthorized" });
}