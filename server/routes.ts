import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage, pool } from "./storage";
import { insertStorySchema, insertCategorySchema, insertBookSchema, insertBookChapterSchema, signupSchema, insertBookRatingSchema, insertMotivationalStorySchema, insertMotivationalLessonSchema, insertStoryPartSchema, insertStoryPageSchema, insertDuaRatingSchema, insertStoryRatingSchema } from "@shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv, createHash } from "crypto";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import nodemailer from "nodemailer";

const scryptAsync = promisify(scrypt);

const audioDir = path.join(process.cwd(), "uploads", "audio");
const coversDir = path.join(process.cwd(), "uploads", "covers");
const pdfsDir = path.join(process.cwd(), "uploads", "pdfs");
const previewsDir = path.join(process.cwd(), "uploads", "previews");
const videosDir = path.join(process.cwd(), "uploads", "videos");
const avatarsDir = path.join(process.cwd(), "uploads", "avatars");
const adsDir = path.join(process.cwd(), "uploads", "ads");
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(coversDir, { recursive: true });
fs.mkdirSync(pdfsDir, { recursive: true });
fs.mkdirSync(previewsDir, { recursive: true });
fs.mkdirSync(videosDir, { recursive: true });
fs.mkdirSync(avatarsDir, { recursive: true });
fs.mkdirSync(adsDir, { recursive: true });

function makeFilename(file: Express.Multer.File) {
  const ext = path.extname(file.originalname);
  return `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
}

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, audioDir),
  filename: (_req, file, cb) => cb(null, makeFilename(file)),
});
const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, coversDir),
  filename: (_req, file, cb) => cb(null, makeFilename(file)),
});
const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, pdfsDir),
  filename: (_req, file, cb) => cb(null, makeFilename(file)),
});
const previewStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, previewsDir),
  filename: (_req, file, cb) => cb(null, makeFilename(file)),
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/x-wav"];
    cb(null, allowed.includes(file.mimetype));
  },
});
const coverUpload = multer({
  storage: coverStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});
const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});
const previewUpload = multer({
  storage: previewStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, videosDir),
  filename: (_req, file, cb) => cb(null, makeFilename(file)),
});
const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    cb(null, allowed.includes(file.mimetype));
  },
});
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => cb(null, makeFilename(file)),
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    cb(null, allowed.includes(file.mimetype));
  },
});
const adFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, adsDir),
  filename: (_req, file, cb) => cb(null, makeFilename(file)),
});
const adFileUpload = multer({
  storage: adFileStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
    cb(null, allowed.includes(file.mimetype));
  },
});

async function sendOtpEmail(toEmail: string, otpCode: string, senderEmail: string, senderPassword: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: senderEmail, pass: senderPassword },
  });
  await transporter.sendMail({
    from: `"Stories of Light" <${senderEmail}>`,
    to: toEmail,
    subject: "Your Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a6b4a; margin-bottom: 8px;">Password Reset Code</h2>
        <p style="color: #555; margin-bottom: 24px;">Use the verification code below to reset your password. This code expires in 10 minutes.</p>
        <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a6b4a;">${otpCode}</span>
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const _encKey = createHash("sha256").update(process.env.SESSION_SECRET || "sol-default-enc-key-32").digest();
function encryptSecret(text: string): string {
  if (!text) return "";
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", _encKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
function decryptSecret(encryptedText: string): string {
  try {
    if (!encryptedText || !encryptedText.includes(":")) return encryptedText || "";
    const [ivHex, encHex] = encryptedText.split(":");
    const decipher = createDecipheriv("aes-256-cbc", _encKey, Buffer.from(ivHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}

function toUrlSlugUtil(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function seedSectionPages() {
  const sections = [
    {
      name: "Books",
      slug: "Books",
      type: "book" as const,
      description: "Explore our curated collection of Islamic books for your learning journey.",
      image: "/images/books-hero.png",
      orderIndex: 100,
    },
    {
      name: "Motivational Stories",
      slug: "Motivational Stories",
      type: "motivational-story" as const,
      description: "Motivational Islamic Tales – Inspire Your Faith, Life, and Success.",
      image: "/images/motivational-hero.png",
      orderIndex: 101,
    },
    {
      name: "Duas & Supplications",
      slug: "Duas & Supplications",
      type: "dua" as const,
      description: "Authentic Supplications — Arabic Text, Translation & Explanation.",
      image: "/images/motivational-hero.png",
      orderIndex: 102,
    },
  ];

  for (const section of sections) {
    const existing = await storage.getCategories(section.type);
    if (existing.length === 0) {
      await storage.createCategory({
        name: section.name,
        slug: section.slug,
        type: section.type,
        description: section.description,
        image: section.image,
        orderIndex: section.orderIndex,
      });
    }
  }
}

async function backfillCategoryUrlSlugs() {
  const { db } = await import("./storage");
  const { categories } = await import("../shared/schema");
  const { isNull, eq } = await import("drizzle-orm");
  const rows = await db.select().from(categories).where(isNull(categories.urlSlug));
  for (const row of rows) {
    const urlSlug = toUrlSlugUtil(row.name);
    await db.update(categories).set({ urlSlug }).where(eq(categories.id, row.id));
  }
  const urlSlugPattern = /^[a-z0-9-]+$/;
  const sectionTypes = ["book", "motivational-story", "dua"];
  const allCats = await db.select().from(categories);
  for (const cat of allCats) {
    if (sectionTypes.includes(cat.type) && (urlSlugPattern.test(cat.slug) || cat.slug.includes("-section"))) {
      await db.update(categories).set({ slug: cat.name }).where(eq(categories.id, cat.id));
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedSectionPages().catch(console.error);
  await backfillCategoryUrlSlugs().catch(console.error);

  // ── WebSocket server for real-time updates ──────────────────────────────────
  const wss = new WebSocketServer({ noServer: true });
  const wsClients = new Set<any>();

  wss.on("connection", (ws: any) => {
    wsClients.add(ws);
    ws.on("close", () => wsClients.delete(ws));
    ws.on("error", () => wsClients.delete(ws));
  });

  httpServer.on("upgrade", (req: any, socket: any, head: any) => {
    if (req.url === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  function broadcast(payload: object) {
    const msg = JSON.stringify(payload);
    wsClients.forEach((client: any) => {
      if (client.readyState === 1) client.send(msg);
    });
  }

  // Broadcast invalidation events after any successful admin mutation
  app.use((req: any, res: any, next: any) => {
    if (!["POST", "PATCH", "DELETE", "PUT"].includes(req.method)) return next();
    const origJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode < 400) {
        const p = req.path;
        let keys: string[] = [];
        if (p.startsWith("/api/stories") || p.startsWith("/api/admin/stories")) keys = ["/api/stories"];
        else if (p.startsWith("/api/books") || p.startsWith("/api/admin/books")) keys = ["/api/books"];
        else if (p.startsWith("/api/categories") || p.startsWith("/api/admin/categories")) keys = ["/api/categories"];
        else if (p.startsWith("/api/duas") || p.startsWith("/api/admin/duas") || p.startsWith("/api/admin/dua-parts")) keys = ["/api/duas"];
        else if (p.startsWith("/api/motivational-stories") || p.startsWith("/api/admin/motivational")) keys = ["/api/motivational-stories"];
        else if (p.startsWith("/api/admin/footer-pages")) keys = ["/api/admin/footer-pages"];
        if (keys.length) broadcast({ type: "invalidate", keys });
      }
      return origJson(body);
    };
    next();
  });
  // ────────────────────────────────────────────────────────────────────────────

  const PgSession = connectPgSimple(session);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "stories-of-light-secret",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: new PgSession({
        pool,
        createTableIfMissing: true,
        tableName: "user_sessions",
      }),
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/uploads/covers", express.static(coversDir));
  app.use("/uploads/previews", express.static(previewsDir));
  app.use("/uploads/audio", express.static(path.join(process.cwd(), "uploads", "audio")));
  app.use("/uploads/videos", express.static(videosDir));
  app.use("/uploads/avatars", express.static(avatarsDir));

  passport.use(
    new LocalStrategy(
      { usernameField: "login" },
      async (login, password, done) => {
        try {
          let user = await storage.getUserByUsername(login);
          if (!user) {
            user = await storage.getUserByEmail(login);
          }
          if (!user) return done(null, false, { message: "Invalid credentials" });
          const match = await comparePasswords(password, user.password);
          if (!match) return done(null, false, { message: "Invalid credentials" });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  function requireAuth(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ message: "Unauthorized" });
  }

  function requireSuperOwner(req: any, res: any, next: any) {
    const role = (req.user as any)?.role;
    if (req.isAuthenticated() && role === "super_owner") return next();
    return res.status(403).json({ message: "Forbidden: Super Owner access required" });
  }

  function requireAdmin(req: any, res: any, next: any) {
    const role = (req.user as any)?.role;
    if (req.isAuthenticated() && (role === "super_owner" || role === "admin" || role === "owner")) return next();
    return res.status(403).json({ message: "Forbidden" });
  }

  function requireStaff(req: any, res: any, next: any) {
    const role = (req.user as any)?.role;
    if (req.isAuthenticated() && ["super_owner", "admin", "owner", "moderator", "editor"].includes(role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  }

  // Returns the userId to filter content by:
  // - Moderators/editors are always restricted to their own content
  // - Admins/owners/super_owners can optionally impersonate a contributor via ?viewAs=userId
  function resolveContentUserId(req: any): string | undefined {
    const role = (req.user as any)?.role;
    if (["moderator", "editor"].includes(role)) return (req.user as any).id;
    if (["super_owner", "owner", "admin"].includes(role)) return req.query.viewAs as string | undefined;
    return undefined;
  }

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const { email, password, name } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const username = email.split("@")[0] + "-" + randomBytes(3).toString("hex");
      const hashedPass = await hashPassword(password);
      const user = await storage.createUserWithEmail({
        email,
        password: hashedPass,
        name,
        username,
        role: "user",
        plainPassword: password,
      });

      req.logIn(user, (err: any) => {
        if (err) return res.status(500).json({ message: "Login after signup failed" });
        return res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        });
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const loginField = req.body.email || req.body.username;
    req.body.login = loginField;
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.logIn(user, (err: any) => {
        if (err) return next(err);
        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (req.isAuthenticated()) {
      const sessionUser = req.user as any;
      const freshUser = await storage.getUser(sessionUser.id);
      if (!freshUser) return res.status(401).json({ message: "Not authenticated" });
      Object.assign(sessionUser, { role: freshUser.role, permissions: freshUser.permissions, email: freshUser.email, name: freshUser.name });
      return res.json({
        id: freshUser.id,
        username: freshUser.username,
        email: freshUser.email,
        name: freshUser.name,
        role: freshUser.role,
        permissions: freshUser.permissions || [],
        avatarUrl: freshUser.avatarUrl ?? null,
      });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.json({ message: "If an account with that email exists, a verification code has been sent." });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await storage.setUserOtp(user.id, otp, expiry);

    const senderEmail = await storage.getSetting("emailSenderAddress");
    const senderPassword = await storage.getSetting("emailSenderPassword");

    if (senderEmail && senderPassword) {
      try {
        await sendOtpEmail(email, otp, senderEmail, senderPassword);
      } catch (err: any) {
        console.error("[OTP Email] Failed to send:", err.message);
        return res.status(500).json({ message: "Failed to send verification email. Check email settings in Admin Panel." });
      }
    } else {
      console.log(`[OTP - No Email Config] Code for ${email}: ${otp}`);
      return res.status(503).json({ message: "Email sending is not configured. Please contact the administrator." });
    }

    return res.json({ message: "Verification code sent to your email." });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and code are required" });

    const user = await storage.getUserByEmail(email);
    if (!user || !user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    if (new Date() > user.otpExpiry) {
      await storage.clearUserOtp(user.id);
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }
    if (user.otpCode !== String(otp).trim()) {
      return res.status(400).json({ message: "Incorrect verification code" });
    }

    return res.json({ message: "Code verified", email });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password || password.length < 6) {
      return res.status(400).json({ message: "All fields are required and password must be at least 6 characters" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    if (new Date() > user.otpExpiry) {
      await storage.clearUserOtp(user.id);
      return res.status(400).json({ message: "Verification code has expired. Please start over." });
    }
    if (user.otpCode !== String(otp).trim()) {
      return res.status(400).json({ message: "Incorrect verification code" });
    }

    const hashedPass = await hashPassword(password);
    await storage.updateUser(user.id, { password: hashedPass, plainPassword: password } as any);
    await storage.clearUserOtp(user.id);

    return res.json({ message: "Password has been reset successfully" });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    const sessionUser = req.user as any;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await storage.getUserByEmail(sessionUser.email);
    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }
    if (!user.password) {
      return res.status(400).json({ message: "This account uses social login and has no password to change" });
    }
    const match = await comparePasswords(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    const hashedPass = await hashPassword(newPassword);
    await storage.updateUser(user.id, { password: hashedPass, plainPassword: newPassword } as any);
    return res.json({ message: "Password changed successfully" });
  });

  app.get("/auth/google", async (req, res) => {
    const settings = await storage.getAllSettings();
    if (settings.googleLoginEnabled === "false") {
      return res.redirect("/login?error=google_disabled");
    }
    const clientId = settings.googleClientId;
    const redirectUrl = settings.googleRedirectUrl;
    if (!clientId || !redirectUrl) {
      return res.redirect("/login?error=google_not_configured");
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUrl,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code, error } = req.query;
    if (error || !code) {
      return res.redirect("/login?error=google_cancelled");
    }
    try {
      const settings = await storage.getAllSettings();
      const clientId = settings.googleClientId;
      const clientSecret = decryptSecret(settings.googleClientSecret || "");
      const redirectUrl = settings.googleRedirectUrl;
      if (!clientId || !clientSecret || !redirectUrl) {
        return res.redirect("/login?error=google_not_configured");
      }
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUrl,
          grant_type: "authorization_code",
        }).toString(),
      });
      const tokenData = await tokenRes.json() as any;
      if (!tokenData.access_token) {
        return res.redirect("/login?error=google_token_failed");
      }
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = await userInfoRes.json() as any;
      const { email, name, picture } = googleUser;
      if (!email) return res.redirect("/login?error=google_no_email");

      let user = await storage.getUserByEmail(email);
      if (!user) {
        const username = email.split("@")[0].replace(/[^a-z0-9]/gi, "") + "_" + randomBytes(3).toString("hex");
        const tempPass = await hashPassword(randomBytes(16).toString("hex"));
        user = await storage.createUser({
          email,
          username,
          password: tempPass,
          name: name || null,
          role: "user",
        } as any);
      }
      if (picture && !user.avatarUrl) {
        await storage.updateUser(user.id, { avatarUrl: picture } as any);
      }

      await new Promise<void>((resolve, reject) => {
        req.login(user!, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return res.redirect("/dashboard");
    } catch (err) {
      console.error("Google OAuth error:", err);
      return res.redirect("/login?error=google_failed");
    }
  });

  app.get("/api/profile/dashboard", requireAuth, async (req, res) => {
    const user = req.user as any;
    const bookmarkCount = await storage.getBookmarkCount(user.id);
    const bookRatingCount = await storage.getUserBookRatingCount(user.id);
    const userBookRatings = await storage.getUserBookRatings(user.id);
    const userBookmarks = await storage.getBookmarks(user.id);
    const bookBookmarkCount = await storage.getBookBookmarkCount(user.id);
    const userBookProgress = await storage.getUserBookProgress(user.id);

    let lastReadStory = null;
    if (user.lastReadStoryId) {
      lastReadStory = await storage.getStoryById(user.lastReadStoryId);
    }

    const categoriesRead: Record<string, number> = {};
    for (const bm of userBookmarks) {
      const catName = bm.story.category?.name || "Uncategorized";
      categoriesRead[catName] = (categoriesRead[catName] || 0) + 1;
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl ?? null,
      },
      stats: {
        totalBookmarks: bookmarkCount,
        totalRatings: bookRatingCount,
        categoriesExplored: Object.keys(categoriesRead).length,
        bookBookmarks: bookBookmarkCount,
        booksInProgress: userBookProgress.length,
      },
      lastReadStory: lastReadStory ? {
        id: lastReadStory.id,
        title: lastReadStory.title,
        slug: lastReadStory.slug,
        thumbnail: lastReadStory.thumbnail,
        category: lastReadStory.category,
        readAt: user.lastReadAt,
      } : null,
      recentBookmarks: userBookmarks.slice(0, 5).map(bm => ({
        id: bm.id,
        storyId: bm.storyId,
        createdAt: bm.createdAt,
        story: {
          id: bm.story.id,
          title: bm.story.title,
          slug: bm.story.slug,
          excerpt: bm.story.excerpt,
          thumbnail: bm.story.thumbnail,
          category: bm.story.category,
        },
      })),
      recentRatings: userBookRatings.slice(0, 5).map(r => ({
        id: r.id,
        bookId: r.bookId,
        bookTitle: r.bookTitle,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      categoriesExplored: categoriesRead,
      bookProgress: userBookProgress.slice(0, 5).map(p => ({
        bookId: p.bookId,
        lastPage: p.lastPage,
        updatedAt: p.updatedAt,
        book: { id: p.book.id, title: p.book.title, slug: p.book.slug, coverUrl: p.book.coverUrl, type: p.book.type },
      })),
      recentBookBookmarks: (await storage.getUserBookBookmarks(user.id)).slice(0, 5).map(bb => ({
        id: bb.id,
        bookId: bb.bookId,
        createdAt: bb.createdAt,
        book: { id: bb.book.id, title: bb.book.title, slug: bb.book.slug, coverUrl: bb.book.coverUrl, author: bb.book.author, type: bb.book.type },
      })),
    });
  });

  app.get("/api/profile", requireAuth, async (req, res) => {
    const user = req.user as any;
    let lastReadStory = null;
    if (user.lastReadStoryId) {
      lastReadStory = await storage.getStoryById(user.lastReadStoryId);
    }
    const userBookmarks = await storage.getBookmarks(user.id);

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt,
      lastReadStory: lastReadStory ? {
        id: lastReadStory.id,
        title: lastReadStory.title,
        slug: lastReadStory.slug,
        readAt: user.lastReadAt,
      } : null,
      bookmarks: userBookmarks.map(bm => ({
        id: bm.id,
        storyId: bm.storyId,
        createdAt: bm.createdAt,
        story: {
          id: bm.story.id,
          title: bm.story.title,
          slug: bm.story.slug,
          excerpt: bm.story.excerpt,
          thumbnail: bm.story.thumbnail,
          category: bm.story.category,
        },
      })),
    });
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { name } = req.body;
    const updated = await storage.updateUser(user.id, { name });
    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.json({ id: updated.id, username: updated.username, email: updated.email, name: updated.name, role: updated.role, avatarUrl: updated.avatarUrl ?? null });
  });

  app.post("/api/profile/avatar", requireAuth, avatarUpload.single("avatar"), async (req, res) => {
    const user = req.user as any;
    if (!req.file) return res.status(400).json({ message: "No image provided" });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    if (user.avatarUrl && user.avatarUrl.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), user.avatarUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const updated = await storage.updateUser(user.id, { avatarUrl } as any);
    if (!updated) return res.status(404).json({ message: "User not found" });
    return res.json({ avatarUrl });
  });

  app.post("/api/bookmarks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { storyId } = req.body;
    if (!storyId) return res.status(400).json({ message: "storyId is required" });

    const existing = await storage.getBookmark(user.id, storyId);
    if (existing) {
      await storage.deleteBookmark(user.id, storyId);
      return res.json({ bookmarked: false });
    }

    await storage.createBookmark(user.id, storyId);
    return res.json({ bookmarked: true });
  });

  app.get("/api/bookmarks/:storyId", requireAuth, async (req, res) => {
    const user = req.user as any;
    const bm = await storage.getBookmark(user.id, req.params.storyId);
    return res.json({ bookmarked: !!bm });
  });

  app.delete("/api/bookmarks/:storyId", requireAuth, async (req, res) => {
    const user = req.user as any;
    await storage.deleteBookmark(user.id, req.params.storyId);
    return res.json({ bookmarked: false });
  });

  app.post("/api/stories/:id/track-read", requireAuth, async (req, res) => {
    const user = req.user as any;
    await storage.updateUser(user.id, {
      lastReadStoryId: req.params.id,
      lastReadAt: new Date(),
    } as any);
    return res.json({ success: true });
  });

  app.get("/api/categories", async (req: any, res) => {
    const type = req.query.type as string | undefined;
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);

    if (type === "all") {
      const cats = await storage.getCategories(undefined, !isStaff);
      const [storyCounts, bookCounts, motivationalCounts, duaCounts, storyViews, bookViews, motivationalViews, duaViews] = await Promise.all([
        storage.getCategoryStoryCounts(),
        storage.getCategoryBookCounts(),
        storage.getCategoryMotivationalCounts(),
        storage.getCategoryDuaCounts(),
        storage.getCategoryStoryViewCounts(),
        storage.getCategoryBookViewCounts(),
        storage.getCategoryMotivationalViewCounts(),
        storage.getCategoryDuaViewCounts(),
      ]);
      const withCounts = cats.map(c => {
        let contentCount = 0;
        let totalViews = 0;
        if (c.type === "story") { contentCount = storyCounts[c.id] || 0; totalViews = storyViews[c.id] || 0; }
        else if (c.type === "book") { contentCount = bookCounts[c.name] || 0; totalViews = bookViews[c.name] || 0; }
        else if (c.type === "motivational-story") { contentCount = motivationalCounts[c.name] || 0; totalViews = motivationalViews[c.name] || 0; }
        else if (c.type === "dua") { contentCount = duaCounts[c.name] || 0; totalViews = duaViews[c.name] || 0; }
        return { ...c, contentCount, storyCount: c.type === "story" ? contentCount : 0, totalViews };
      });
      return res.json(withCounts);
    }

    const effectiveType = type || "story";
    const cats = await storage.getCategories(effectiveType, !isStaff);

    if (effectiveType === "story") {
      const [storyCounts, storyViews] = await Promise.all([
        storage.getCategoryStoryCounts(),
        storage.getCategoryStoryViewCounts(),
      ]);
      const withCounts = cats.map(c => ({ ...c, contentCount: storyCounts[c.id] || 0, storyCount: storyCounts[c.id] || 0, totalViews: storyViews[c.id] || 0 }));
      return res.json(withCounts);
    }

    let countMap: Record<string, number> = {};
    let viewMap: Record<string, number> = {};
    if (effectiveType === "book") { countMap = await storage.getCategoryBookCounts(); viewMap = await storage.getCategoryBookViewCounts(); }
    else if (effectiveType === "motivational-story") { countMap = await storage.getCategoryMotivationalCounts(); viewMap = await storage.getCategoryMotivationalViewCounts(); }
    else if (effectiveType === "dua") { countMap = await storage.getCategoryDuaCounts(); viewMap = await storage.getCategoryDuaViewCounts(); }

    const withCounts = cats.map(c => ({ ...c, contentCount: countMap[c.name] || 0, totalViews: viewMap[c.name] || 0 }));
    res.json(withCounts);
  });

  app.post("/api/stories/:id/view", async (req, res) => {
    await storage.incrementStoryViews(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/categories/:slug", async (req: any, res) => {
    const cat = await storage.getCategoryBySlug(req.params.slug);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);
    if (!isStaff && cat.isActive === false) return res.status(404).json({ message: "Category not found" });
    res.json(cat);
  });

  app.patch("/api/admin/categories/:id/active", requireAdmin, async (req, res) => {
    const { isActive } = req.body;
    const updated = await storage.updateCategory(req.params.id, { isActive });
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json(updated);
  });

  app.post("/api/categories", requireStaff, async (req, res) => {
    const parsed = insertCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const cat = await storage.createCategory(parsed.data);
    res.status(201).json(cat);
  });

  app.patch("/api/categories/:id", requireStaff, async (req, res) => {
    const updated = await storage.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json(updated);
  });

  app.delete("/api/categories/:id", requireStaff, async (req, res) => {
    await storage.deleteCategory(req.params.id);
    res.json({ message: "Deleted" });
  });

  app.get("/api/stories", async (req: any, res) => {
    const { status, categoryId, featured, search, limit, offset, userId, includeNullUser, startDate, endDate, sortBy } = req.query;
    const opts: any = {};
    if (status) opts.status = status;
    if (categoryId) opts.categoryId = categoryId;
    if (featured === "true") opts.featured = true;
    if (search) opts.search = search;
    if (limit) opts.limit = parseInt(limit as string);
    if (offset) opts.offset = parseInt(offset as string);
    if (userId) opts.userId = userId as string;
    if (includeNullUser === "true") opts.includeNullUser = true;
    if (startDate) opts.startDate = startDate as string;
    if (endDate) opts.endDate = endDate as string;
    if (sortBy === "views") opts.sortBy = "views";
    // Enforce own-content filter for logged-in moderators/editors
    const role = req.user?.role;
    if (req.isAuthenticated && req.isAuthenticated() && ["moderator", "editor"].includes(role)) {
      opts.userId = req.user.id;
    }
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);
    if (!isStaff) opts.activeOnly = true;
    const storiesList = await storage.getStories(opts);
    res.json(storiesList);
  });

  app.get("/api/stories/stats", requireStaff, async (req, res) => {
    const uid = resolveContentUserId(req);
    const incNull = req.query.includeNullUser === "true";
    const [total, published, drafts, totalViews, recentCount] = await Promise.all([
      storage.getStoryCount(undefined, uid, incNull),
      storage.getStoryCount("published", uid, incNull),
      storage.getStoryCount("draft", uid, incNull),
      storage.getStoryTotalViews(uid, incNull),
      storage.getRecentStoryCount(30, uid, incNull),
    ]);
    res.json({ total, published, drafts, totalViews, recentCount });
  });

  app.get("/api/admin/dashboard", requireStaff, async (_req, res) => {
    try {
      const [totalStories, publishedStories, draftStories] = await Promise.all([
        storage.getStoryCount(),
        storage.getStoryCount("published"),
        storage.getStoryCount("draft"),
      ]);
      const [totalMotivational, publishedMotivational] = await Promise.all([
        storage.getMotivationalStoryCount(),
        storage.getMotivationalStoryCount(true),
      ]);
      const [duasAll, duasPublished] = await Promise.all([
        storage.getDuas({ limit: 1 }),
        storage.getDuas({ published: true, limit: 1 }),
      ]);
      const allBooks = await storage.getBooks();
      const totalBooks = allBooks.length;
      const freeBooks = allBooks.filter((b: any) => b.type === "free").length;
      const paidBooks = allBooks.filter((b: any) => b.type === "paid").length;

      const [usersRes, topStoriesRes, topDuasRes, topBooksRes, topMotivRes,
             bookmarkedStoriesRes, bookmarkedDuasRes, bookmarkedBooksRes, bookmarkedMotivRes,
             categoryBreakdownRes, userGrowthRes,
             recentStoriesRes, recentDuasRes, recentBooksRes, recentMotivRes,
             totalViewsRes, topContributorsRes, activeUsersRes] = await Promise.all([
        pool.query(`SELECT COUNT(*) FROM users`),
        pool.query(`SELECT s.id, s.title, s.slug, s.excerpt, COALESCE(COUNT(b.id), 0) as views, c.name as category_name, c.url_slug as category_url_slug FROM stories s LEFT JOIN categories c ON s.category_id = c.id LEFT JOIN bookmarks b ON b.story_id = s.id WHERE s.deleted_at IS NULL GROUP BY s.id, s.title, s.slug, s.excerpt, c.name, c.url_slug ORDER BY views DESC LIMIT 5`),
        pool.query(`SELECT id, title, slug, description, views, category FROM duas WHERE deleted_at IS NULL ORDER BY views DESC LIMIT 5`),
        pool.query(`SELECT id, title, slug, description, views, average_rating, category FROM books WHERE deleted_at IS NULL ORDER BY views DESC, average_rating DESC NULLS LAST LIMIT 5`),
        pool.query(`SELECT id, title, slug, description, views, average_rating, category FROM motivational_stories WHERE deleted_at IS NULL ORDER BY views DESC, average_rating DESC NULLS LAST LIMIT 5`),
        pool.query(`SELECT s.id, s.title, s.slug, s.excerpt as description, COUNT(b.id) as bookmark_count FROM stories s JOIN bookmarks b ON b.story_id = s.id WHERE s.deleted_at IS NULL GROUP BY s.id, s.title, s.slug, s.excerpt ORDER BY bookmark_count DESC LIMIT 5`),
        pool.query(`SELECT d.id, d.title, d.slug, d.description, COUNT(db.id) as bookmark_count FROM duas d JOIN dua_bookmarks db ON db.dua_id = d.id WHERE d.deleted_at IS NULL GROUP BY d.id, d.title, d.slug, d.description ORDER BY bookmark_count DESC LIMIT 5`),
        pool.query(`SELECT b.id, b.title, b.slug, b.description, COUNT(bb.id) as bookmark_count FROM books b JOIN book_bookmarks bb ON bb.book_id = b.id WHERE b.deleted_at IS NULL GROUP BY b.id, b.title, b.slug, b.description ORDER BY bookmark_count DESC LIMIT 5`),
        pool.query(`SELECT ms.id, ms.title, ms.slug, ms.description, COUNT(mb.id) as bookmark_count FROM motivational_stories ms JOIN motivational_bookmarks mb ON mb.story_id = ms.id WHERE ms.deleted_at IS NULL GROUP BY ms.id, ms.title, ms.slug, ms.description ORDER BY bookmark_count DESC LIMIT 5`),
        pool.query(`SELECT c.name, c.url_slug, COUNT(DISTINCT s.id) as story_count, COUNT(DISTINCT b.id) as total_views FROM categories c LEFT JOIN stories s ON s.category_id = c.id AND s.deleted_at IS NULL AND s.status = 'published' LEFT JOIN bookmarks b ON b.story_id = s.id WHERE c.type = 'story' AND c.deleted_at IS NULL GROUP BY c.id, c.name, c.url_slug ORDER BY story_count DESC`),
        pool.query(`SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as month, TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as year_month, COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY year_month, month ORDER BY year_month`),
        pool.query(`SELECT s.id, s.title, s.slug, s.excerpt as description, s.status, s.updated_at, c.name as category_name, c.url_slug as category_url_slug FROM stories s LEFT JOIN categories c ON s.category_id = c.id WHERE s.deleted_at IS NULL ORDER BY s.updated_at DESC LIMIT 8`),
        pool.query(`SELECT id, title, slug, description, updated_at, CASE WHEN published THEN 'published' ELSE 'draft' END as status, category as category_name FROM duas WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 8`),
        pool.query(`SELECT id, title, slug, description, created_at as updated_at, 'published' as status, category as category_name FROM books WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 8`),
        pool.query(`SELECT id, title, slug, description, updated_at, CASE WHEN published THEN 'published' ELSE 'draft' END as status, category as category_name FROM motivational_stories WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 8`),
        pool.query(`SELECT COALESCE((SELECT SUM(views) FROM duas WHERE deleted_at IS NULL), 0) + COALESCE((SELECT SUM(views) FROM books WHERE deleted_at IS NULL), 0) + COALESCE((SELECT SUM(views) FROM motivational_stories WHERE deleted_at IS NULL), 0) as total_views`),
        pool.query(`SELECT id, username, name, email, role, permissions, avatar_url, created_at FROM users WHERE role IN ('admin', 'editor', 'moderator') ORDER BY created_at ASC LIMIT 10`),
        pool.query(`SELECT u.id, u.username, u.name, u.email, u.avatar_url, u.created_at, COUNT(DISTINCT srp.id) as reading_count, COUNT(DISTINCT b.id) as story_bookmarks, COUNT(DISTINCT db.id) as dua_bookmarks, COUNT(DISTINCT bb.id) as book_bookmarks, COUNT(DISTINCT mb.id) as motivational_bookmarks FROM users u LEFT JOIN story_reading_progress srp ON srp.user_id = u.id LEFT JOIN bookmarks b ON b.user_id = u.id LEFT JOIN dua_bookmarks db ON db.user_id = u.id LEFT JOIN book_bookmarks bb ON bb.user_id = u.id LEFT JOIN motivational_bookmarks mb ON mb.user_id = u.id WHERE u.role = 'user' GROUP BY u.id, u.username, u.name, u.email, u.avatar_url, u.created_at ORDER BY COUNT(DISTINCT srp.id) DESC, COUNT(DISTINCT b.id) DESC LIMIT 10`),
      ]);

      res.json({
        content: {
          stories: { total: totalStories, published: publishedStories, drafts: draftStories },
          motivational: { total: totalMotivational, published: publishedMotivational },
          duas: { total: duasAll.total, published: duasPublished.total },
          books: { total: totalBooks, free: freeBooks, paid: paidBooks },
          users: { total: parseInt(usersRes.rows[0].count) },
        },
        totalViews: parseInt(totalViewsRes.rows[0].total_views) || 0,
        topContent: {
          stories: topStoriesRes.rows,
          duas: topDuasRes.rows,
          books: topBooksRes.rows,
          motivational: topMotivRes.rows,
        },
        bookmarked: {
          stories: bookmarkedStoriesRes.rows,
          duas: bookmarkedDuasRes.rows,
          books: bookmarkedBooksRes.rows,
          motivational: bookmarkedMotivRes.rows,
        },
        categories: categoryBreakdownRes.rows,
        userGrowth: userGrowthRes.rows,
        recentActivity: {
          stories: recentStoriesRes.rows,
          duas: recentDuasRes.rows,
          books: recentBooksRes.rows,
          motivational: recentMotivRes.rows,
        },
        topContributors: topContributorsRes.rows,
        activeUsers: activeUsersRes.rows,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  app.get("/api/admin/contributors/:id/stats", requireStaff, async (req, res) => {
    try {
      const { id } = req.params;
      const [userRes, userContentRes, siteStatsRes] = await Promise.all([
        pool.query(`SELECT id, username, name, email, role, permissions, avatar_url, created_at FROM users WHERE id = $1`, [id]),
        pool.query(`
          SELECT
            (SELECT COUNT(*) FROM stories WHERE deleted_at IS NULL AND user_id = $1) as my_articles,
            (SELECT COUNT(*) FROM stories WHERE deleted_at IS NULL AND user_id = $1 AND status = 'published') as my_published_articles,
            (SELECT COALESCE(SUM(views), 0) FROM stories WHERE deleted_at IS NULL AND user_id = $1) as my_article_views,
            (SELECT COUNT(*) FROM duas WHERE deleted_at IS NULL AND user_id = $1) as my_duas,
            (SELECT COALESCE(SUM(views), 0) FROM duas WHERE deleted_at IS NULL AND user_id = $1) as my_dua_views,
            (SELECT COUNT(*) FROM books WHERE deleted_at IS NULL AND user_id = $1) as my_books,
            (SELECT COALESCE(SUM(views), 0) FROM books WHERE deleted_at IS NULL AND user_id = $1) as my_book_views,
            (SELECT COUNT(*) FROM motivational_stories WHERE deleted_at IS NULL AND user_id = $1) as my_motivational,
            (SELECT COALESCE(SUM(views), 0) FROM motivational_stories WHERE deleted_at IS NULL AND user_id = $1) as my_motivational_views
        `, [id]),
        pool.query(`
          SELECT
            (SELECT COUNT(*) FROM stories WHERE deleted_at IS NULL AND status = 'published') as total_articles,
            (SELECT COUNT(*) FROM duas WHERE deleted_at IS NULL AND published = true) as total_duas,
            (SELECT COUNT(*) FROM books WHERE deleted_at IS NULL) as total_books,
            (SELECT COUNT(*) FROM motivational_stories WHERE deleted_at IS NULL AND published = true) as total_motivational
        `),
      ]);
      if (userRes.rows.length === 0) return res.status(404).json({ message: "Contributor not found" });
      res.json({ contributor: userRes.rows[0], userContent: userContentRes.rows[0], siteStats: siteStatsRes.rows[0] });
    } catch (error) {
      console.error("Contributor stats error:", error);
      res.status(500).json({ message: "Failed to load contributor stats" });
    }
  });

  app.get("/api/admin/contributors/:id/overview", requireStaff, async (req, res) => {
    try {
      const { id } = req.params;

      // Get user first to determine content filter strategy
      const userRes = await pool.query(
        `SELECT id, username, name, email, role, permissions, avatar_url, created_at FROM users WHERE id = $1`,
        [id]
      );
      if (userRes.rows.length === 0) return res.status(404).json({ message: "Contributor not found" });
      const contributor = userRes.rows[0];

      // super_owner and owner include unattributed (null user_id) site content — they own the site.
      // If ?personalOnly=true, only show content directly attributed to this user (no null).
      const personalOnly = req.query.personalOnly === "true";
      const includeNull = !personalOnly && (contributor.role === "super_owner" || contributor.role === "owner");
      const f = includeNull ? `(user_id = $1 OR user_id IS NULL)` : `user_id = $1`;
      const sf = includeNull ? `(s.user_id = $1 OR s.user_id IS NULL)` : `s.user_id = $1`; // for joined story queries

      const [
        statsRes,
        topStoriesRes, topDuasRes, topBooksRes, topMotivRes,
        recentStoriesRes, recentDuasRes, recentBooksRes, recentMotivRes,
        bookmarkedStoriesRes, bookmarkedDuasRes, bookmarkedBooksRes, bookmarkedMotivRes,
        activeVisitorsRes,
      ] = await Promise.all([
        pool.query(`
          SELECT
            (SELECT COUNT(*) FROM stories WHERE deleted_at IS NULL AND ${f}) as my_articles,
            (SELECT COUNT(*) FROM stories WHERE deleted_at IS NULL AND ${f} AND status = 'published') as my_published_articles,
            (SELECT COALESCE(SUM(views), 0) FROM stories WHERE deleted_at IS NULL AND ${f}) as my_article_views,
            (SELECT COUNT(*) FROM motivational_stories WHERE deleted_at IS NULL AND ${f}) as my_motivational,
            (SELECT COUNT(*) FROM motivational_stories WHERE deleted_at IS NULL AND ${f} AND published = true) as my_published_motivational,
            (SELECT COALESCE(SUM(views), 0) FROM motivational_stories WHERE deleted_at IS NULL AND ${f}) as my_motivational_views,
            (SELECT COUNT(*) FROM duas WHERE deleted_at IS NULL AND ${f}) as my_duas,
            (SELECT COALESCE(SUM(views), 0) FROM duas WHERE deleted_at IS NULL AND ${f}) as my_dua_views,
            (SELECT COUNT(*) FROM books WHERE deleted_at IS NULL AND ${f}) as my_books,
            (SELECT COALESCE(SUM(views), 0) FROM books WHERE deleted_at IS NULL AND ${f}) as my_book_views
        `, [id]),
        pool.query(`SELECT s.id, s.title, s.slug, s.excerpt, s.views, c.name as category_name, c.url_slug as category_url_slug FROM stories s LEFT JOIN categories c ON s.category_id = c.id WHERE s.deleted_at IS NULL AND ${sf} ORDER BY s.views DESC LIMIT 5`, [id]),
        pool.query(`SELECT id, title, slug, description, views, category FROM duas WHERE deleted_at IS NULL AND ${f} ORDER BY views DESC LIMIT 5`, [id]),
        pool.query(`SELECT id, title, slug, description, views, category FROM books WHERE deleted_at IS NULL AND ${f} ORDER BY views DESC LIMIT 5`, [id]),
        pool.query(`SELECT id, title, slug, description, views, category FROM motivational_stories WHERE deleted_at IS NULL AND ${f} ORDER BY views DESC LIMIT 5`, [id]),
        pool.query(`SELECT s.id, s.title, s.slug, s.excerpt as description, s.status, s.updated_at, c.name as category_name, c.url_slug as category_url_slug FROM stories s LEFT JOIN categories c ON s.category_id = c.id WHERE s.deleted_at IS NULL AND ${sf} ORDER BY s.updated_at DESC LIMIT 8`, [id]),
        pool.query(`SELECT id, title, slug, description, updated_at, CASE WHEN published THEN 'published' ELSE 'draft' END as status, category as category_name FROM duas WHERE deleted_at IS NULL AND ${f} ORDER BY updated_at DESC LIMIT 8`, [id]),
        pool.query(`SELECT id, title, slug, description, created_at as updated_at, 'published' as status, category as category_name FROM books WHERE deleted_at IS NULL AND ${f} ORDER BY created_at DESC LIMIT 8`, [id]),
        pool.query(`SELECT id, title, slug, description, updated_at, CASE WHEN published THEN 'published' ELSE 'draft' END as status, category as category_name FROM motivational_stories WHERE deleted_at IS NULL AND ${f} ORDER BY updated_at DESC LIMIT 8`, [id]),
        pool.query(`SELECT s.id, s.title, s.slug, s.excerpt as description, COUNT(b.id) as bookmark_count FROM stories s JOIN bookmarks b ON b.story_id = s.id WHERE s.deleted_at IS NULL AND ${sf} GROUP BY s.id, s.title, s.slug, s.excerpt ORDER BY bookmark_count DESC LIMIT 5`, [id]),
        pool.query(`SELECT d.id, d.title, d.slug, d.description, COUNT(db.id) as bookmark_count FROM duas d JOIN dua_bookmarks db ON db.dua_id = d.id WHERE d.deleted_at IS NULL AND ${f.replace(/user_id/g, 'd.user_id')} GROUP BY d.id, d.title, d.slug, d.description ORDER BY bookmark_count DESC LIMIT 5`, [id]),
        pool.query(`SELECT b.id, b.title, b.slug, b.description, COUNT(bb.id) as bookmark_count FROM books b JOIN book_bookmarks bb ON bb.book_id = b.id WHERE b.deleted_at IS NULL AND ${f.replace(/user_id/g, 'b.user_id')} GROUP BY b.id, b.title, b.slug, b.description ORDER BY bookmark_count DESC LIMIT 5`, [id]),
        pool.query(`SELECT ms.id, ms.title, ms.slug, ms.description, COUNT(mb.id) as bookmark_count FROM motivational_stories ms JOIN motivational_bookmarks mb ON mb.story_id = ms.id WHERE ms.deleted_at IS NULL AND ${f.replace(/user_id/g, 'ms.user_id')} GROUP BY ms.id, ms.title, ms.slug, ms.description ORDER BY bookmark_count DESC LIMIT 5`, [id]),
        pool.query(`
          SELECT u.id, u.username, u.name, u.email, u.avatar_url, u.created_at,
            COUNT(DISTINCT srp.id) as reading_count,
            COUNT(DISTINCT bk.id) as story_bookmarks,
            COUNT(DISTINCT db.id) as dua_bookmarks,
            COUNT(DISTINCT bb.id) as book_bookmarks,
            COUNT(DISTINCT mb.id) as motivational_bookmarks
          FROM users u
          LEFT JOIN story_reading_progress srp ON srp.user_id = u.id
            AND srp.story_id IN (SELECT id FROM stories WHERE deleted_at IS NULL AND ${f})
          LEFT JOIN bookmarks bk ON bk.user_id = u.id
            AND bk.story_id IN (SELECT id FROM stories WHERE deleted_at IS NULL AND ${f})
          LEFT JOIN dua_bookmarks db ON db.user_id = u.id
            AND db.dua_id IN (SELECT id FROM duas WHERE deleted_at IS NULL AND ${f})
          LEFT JOIN book_bookmarks bb ON bb.user_id = u.id
            AND bb.book_id IN (SELECT id FROM books WHERE deleted_at IS NULL AND ${f})
          LEFT JOIN motivational_bookmarks mb ON mb.user_id = u.id
            AND mb.story_id IN (SELECT id FROM motivational_stories WHERE deleted_at IS NULL AND ${f})
          WHERE u.role = 'user'
            AND (srp.id IS NOT NULL OR bk.id IS NOT NULL OR db.id IS NOT NULL OR bb.id IS NOT NULL OR mb.id IS NOT NULL)
          GROUP BY u.id, u.username, u.name, u.email, u.avatar_url, u.created_at
          ORDER BY COUNT(DISTINCT srp.id) DESC, COUNT(DISTINCT bk.id) DESC
          LIMIT 20
        `, [id]),
      ]);

      const s = statsRes.rows[0];
      res.json({
        contributor,
        stats: {
          ...s,
          total_views: (
            parseInt(s.my_article_views || "0") +
            parseInt(s.my_dua_views || "0") +
            parseInt(s.my_book_views || "0") +
            parseInt(s.my_motivational_views || "0")
          ).toString(),
        },
        topContent: { stories: topStoriesRes.rows, duas: topDuasRes.rows, books: topBooksRes.rows, motivational: topMotivRes.rows },
        recentActivity: { stories: recentStoriesRes.rows, duas: recentDuasRes.rows, books: recentBooksRes.rows, motivational: recentMotivRes.rows },
        bookmarked: { stories: bookmarkedStoriesRes.rows, duas: bookmarkedDuasRes.rows, books: bookmarkedBooksRes.rows, motivational: bookmarkedMotivRes.rows },
        activeVisitors: activeVisitorsRes.rows,
      });
    } catch (error) {
      console.error("Contributor overview error:", error);
      res.status(500).json({ message: "Failed to load contributor overview" });
    }
  });

  app.get("/api/admin/users/:id/activity", requireStaff, async (req, res) => {
    try {
      const { id } = req.params;
      const [userRes, activityRes, recentRes] = await Promise.all([
        pool.query(`SELECT id, username, name, email, avatar_url, created_at FROM users WHERE id = $1`, [id]),
        pool.query(`
          SELECT
            COUNT(DISTINCT srp.id) as articles_read,
            COUNT(DISTINCT b.id) as story_bookmarks,
            COUNT(DISTINCT db.id) as dua_bookmarks,
            COUNT(DISTINCT bb.id) as book_bookmarks,
            COUNT(DISTINCT mb.id) as motivational_bookmarks
          FROM users u
          LEFT JOIN story_reading_progress srp ON srp.user_id = u.id
          LEFT JOIN bookmarks b ON b.user_id = u.id
          LEFT JOIN dua_bookmarks db ON db.user_id = u.id
          LEFT JOIN book_bookmarks bb ON bb.user_id = u.id
          LEFT JOIN motivational_bookmarks mb ON mb.user_id = u.id
          WHERE u.id = $1
          GROUP BY u.id
        `, [id]),
        pool.query(`
          SELECT s.title, s.slug, srp.updated_at as read_at
          FROM story_reading_progress srp
          JOIN stories s ON s.id = srp.story_id
          WHERE srp.user_id = $1
          ORDER BY srp.updated_at DESC
          LIMIT 5
        `, [id]),
      ]);
      if (userRes.rows.length === 0) return res.status(404).json({ message: "User not found" });
      res.json({ user: userRes.rows[0], activity: activityRes.rows[0] ?? {}, recentlyRead: recentRes.rows });
    } catch (error) {
      console.error("User activity error:", error);
      res.status(500).json({ message: "Failed to load user activity" });
    }
  });

  app.get("/api/stories/by-slug/:slug", async (req: any, res) => {
    const story = await storage.getStoryBySlug(req.params.slug);
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);
    if (!story || (!isStaff && !story.isActive)) return res.status(404).json({ message: "Story not found" });
    res.json(story);
  });

  app.get("/api/stories/:id", async (req: any, res) => {
    const story = await storage.getStoryById(req.params.id);
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);
    if (!story || (!isStaff && !story.isActive)) return res.status(404).json({ message: "Story not found" });
    res.json(story);
  });

  app.get("/api/stories/:id/related", async (req, res) => {
    const story = await storage.getStoryById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    const related = await storage.getRelatedStories(story.id, story.categoryId);
    res.json(related);
  });

  app.post("/api/stories", requireStaff, async (req, res) => {
    const body = { ...req.body };
    if (body.publishedAt && typeof body.publishedAt === "string") {
      body.publishedAt = new Date(body.publishedAt);
    }
    if ((req as any).session?.userId) body.userId = (req as any).session.userId;
    const parsed = insertStorySchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const story = await storage.createStory(parsed.data);
    res.status(201).json(story);
  });

  app.patch("/api/stories/:id", requireStaff, async (req, res) => {
    const body = { ...req.body };
    if (body.publishedAt && typeof body.publishedAt === "string") {
      body.publishedAt = new Date(body.publishedAt);
    }
    const updated = await storage.updateStory(req.params.id, body);
    if (!updated) return res.status(404).json({ message: "Story not found" });
    res.json(updated);
  });

  app.patch("/api/admin/stories/:id/active", requireAdmin, async (req, res) => {
    const { isActive } = req.body;
    const updated = await storage.updateStory(req.params.id, { isActive });
    if (!updated) return res.status(404).json({ message: "Story not found" });
    res.json(updated);
  });

  app.patch("/api/admin/stories/:id/ad-slots", requireAdmin, async (req, res) => {
    const { adSlots } = req.body;
    const updated = await storage.updateStory(req.params.id, { adSlots: JSON.stringify(adSlots) });
    if (!updated) return res.status(404).json({ message: "Story not found" });
    res.json(updated);
  });

  app.delete("/api/stories/:id", requireStaff, async (req, res) => {
    await storage.deleteStory(req.params.id);
    res.json({ message: "Deleted" });
  });

  app.post("/api/stories/bulk-delete", requireStaff, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: "Invalid ids" });
    await storage.deleteStories(ids);
    res.json({ message: "Deleted" });
  });

  app.post("/api/stories/:id/duplicate", requireStaff, async (req, res) => {
    const story = await storage.getStoryById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    const newStory = await storage.duplicateStory(req.params.id);
    res.status(201).json(newStory);
  });

  app.post("/api/upload/audio", requireStaff, audioUpload.single("audio"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No audio file uploaded" });
    const url = `/uploads/audio/${req.file.filename}`;
    res.json({ url });
  });

  app.post("/api/upload/cover", requireStaff, coverUpload.single("cover"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No cover image uploaded" });
    const url = `/uploads/covers/${req.file.filename}`;
    res.json({ url });
  });

  app.post("/api/upload/pdf", requireStaff, pdfUpload.single("pdf"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No PDF file uploaded" });
    const internalPath = req.file.filename;
    res.json({ path: internalPath });
  });

  app.post("/api/upload/preview", requireStaff, previewUpload.single("preview"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No preview image uploaded" });
    const url = `/uploads/previews/${req.file.filename}`;
    res.json({ url });
  });

  app.post("/api/upload/video", requireStaff, videoUpload.single("video"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No video file uploaded" });
    const url = `/uploads/videos/${req.file.filename}`;
    res.json({ url });
  });

  function sanitizeBook(book: any) {
    const { fullContentUrl, ...safe } = book;
    return { ...safe, hasContent: !!fullContentUrl };
  }

  app.get("/api/books", async (req, res) => {
    const { type, category, search, sort, minRating, userId } = req.query;
    const booksList = await storage.getBooks({
      type: type as string,
      category: category as string,
      search: search as string,
      sort: sort as string,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      userId: userId as string | undefined,
      published: true,
      activeOnly: true,
    });
    res.json(booksList.map(sanitizeBook));
  });

  app.get("/api/books/categories", async (_req, res) => {
    const cats = await storage.getBookCategories();
    res.json(cats);
  });

  app.get("/api/books/featured-free", async (_req, res) => {
    const booksList = await storage.getFeaturedFreeBooks(6);
    res.json(booksList.map(sanitizeBook));
  });

  app.get("/api/books/slug/:slug", async (req: any, res) => {
    const book = await storage.getBookBySlug(req.params.slug);
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);
    if (!book || (!isStaff && !book.isActive)) return res.status(404).json({ message: "Book not found" });
    res.json(sanitizeBook(book));
  });

  app.get("/api/books/:id", async (req: any, res) => {
    const book = await storage.getBookById(req.params.id);
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);
    if (!book || (!isStaff && !book.isActive)) return res.status(404).json({ message: "Book not found" });
    res.json(sanitizeBook(book));
  });

  app.get("/api/books/:id/chapters", async (req, res) => {
    const chapters = await storage.getBookChapters(req.params.id);
    res.json(chapters);
  });

  app.get("/api/books/:id/content", requireAuth, async (req, res) => {
    const book = await storage.getBookById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.type !== "free") return res.status(403).json({ message: "Only free books can be read online" });
    if (!book.fullContentUrl) return res.status(404).json({ message: "Book content not available" });

    const filePath = path.join(pdfsDir, book.fullContentUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "private, no-cache, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    fs.createReadStream(filePath).pipe(res);
  });

  app.get("/api/books/:id/recommendations", async (req, res) => {
    const book = await storage.getBookById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    const recs = await storage.getRecommendedBooks(book.id, book.category);
    res.json(recs.map(sanitizeBook));
  });

  app.post("/api/books/:id/view", async (req, res) => {
    await storage.incrementBookViews(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/books", requireStaff, async (req, res) => {
    const body = { ...req.body };
    if ((req as any).session?.userId) body.userId = (req as any).session.userId;
    const parsed = insertBookSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const book = await storage.createBook(parsed.data);
    res.status(201).json(book);
  });

  app.post("/api/books/:id/duplicate", requireStaff, async (req, res) => {
    const original = await storage.getBookById(req.params.id);
    if (!original) return res.status(404).json({ message: "Book not found" });

    const { id, createdAt, views, averageRating, totalRatings, ...bookData } = original;
    const slug = `${original.slug}-copy-${randomBytes(3).toString("hex")}`;
    const newBook = await storage.createBook({ ...bookData, slug, title: `${original.title} (Copy)` } as any);

    const chapters = await storage.getBookChapters(original.id);
    for (const ch of chapters) {
      await storage.createBookChapter({ bookId: newBook.id, title: ch.title, orderIndex: ch.orderIndex, startPage: ch.startPage, endPage: ch.endPage });
    }

    res.status(201).json(newBook);
  });

  app.patch("/api/books/:id", requireStaff, async (req, res) => {
    const updated = await storage.updateBook(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Book not found" });
    res.json(updated);
  });

  app.delete("/api/books/:id", requireStaff, async (req, res) => {
    await storage.deleteBook(req.params.id);
    res.json({ message: "Deleted" });
  });

  app.get("/api/books/:bookId/chapters", async (req, res) => {
    const chapters = await storage.getBookChapters(req.params.bookId);
    res.json(chapters);
  });

  app.post("/api/books/:bookId/chapters", requireStaff, async (req, res) => {
    const parsed = insertBookChapterSchema.safeParse({ ...req.body, bookId: req.params.bookId });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const ch = await storage.createBookChapter(parsed.data);
    res.status(201).json(ch);
  });

  app.patch("/api/books/chapters/:id", requireStaff, async (req, res) => {
    const updated = await storage.updateBookChapter(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Chapter not found" });
    res.json(updated);
  });

  app.delete("/api/books/chapters/:id", requireStaff, async (req, res) => {
    await storage.deleteBookChapter(req.params.id);
    res.json({ message: "Deleted" });
  });

  app.get("/api/books/:id/parts", async (req, res) => {
    const parts = await storage.getBookParts(req.params.id);
    res.json(parts);
  });

  app.post("/api/books/:id/parts", requireStaff, async (req, res) => {
    const parts = await storage.getBookParts(req.params.id);
    const maxOrder = parts.reduce((m, p) => Math.max(m, p.orderIndex), -1);
    const part = await storage.createBookPart({ ...req.body, bookId: req.params.id, orderIndex: maxOrder + 1 });
    res.status(201).json(part);
  });

  app.patch("/api/books/parts/:id", requireStaff, async (req, res) => {
    const allowed = ["title", "summary", "coverImage", "videoUrl", "audioUrl", "orderIndex"];
    const data: Record<string, any> = {};
    for (const k of allowed) { if (k in req.body) data[k] = req.body[k]; }
    const updated = await storage.updateBookPart(req.params.id, data);
    if (!updated) return res.status(404).json({ message: "Part not found" });
    res.json(updated);
  });

  app.delete("/api/books/parts/:id", requireStaff, async (req, res) => {
    await storage.deleteBookPart(req.params.id);
    res.json({ message: "Deleted" });
  });

  app.post("/api/books/parts/:id/duplicate", requireStaff, async (req, res) => {
    const part = await storage.getBookPartById(req.params.id);
    if (!part) return res.status(404).json({ message: "Part not found" });
    const newPart = await storage.duplicateBookPart(req.params.id, part.bookId);
    res.status(201).json(newPart);
  });

  app.post("/api/books/parts/:id/pages", requireStaff, async (req, res) => {
    const pages = await storage.getBookPages(req.params.id);
    const maxOrder = pages.reduce((m, p) => Math.max(m, p.orderIndex), -1);
    const page = await storage.createBookPage({ ...req.body, partId: req.params.id, orderIndex: maxOrder + 1 });
    res.status(201).json(page);
  });

  app.patch("/api/books/pages/:id", requireStaff, async (req, res) => {
    const data: Record<string, any> = {};
    if ("content" in req.body) data.content = req.body.content;
    if ("orderIndex" in req.body) data.orderIndex = req.body.orderIndex;
    const updated = await storage.updateBookPage(req.params.id, data);
    if (!updated) return res.status(404).json({ message: "Page not found" });
    res.json(updated);
  });

  app.delete("/api/books/pages/:id", requireStaff, async (req, res) => {
    await storage.deleteBookPage(req.params.id);
    res.json({ message: "Deleted" });
  });

  app.post("/api/books/pages/:id/duplicate", requireStaff, async (req, res) => {
    const page = await storage.duplicateBookPage(req.params.id);
    res.status(201).json(page);
  });

  app.get("/api/books/:id/bookmark", requireAuth, async (req, res) => {
    const user = req.user as any;
    const bm = await storage.getBookBookmark(user.id, req.params.id);
    res.json({ bookmarked: !!bm });
  });

  app.post("/api/books/:id/bookmark", requireAuth, async (req, res) => {
    const user = req.user as any;
    const existing = await storage.getBookBookmark(user.id, req.params.id);
    if (existing) {
      await storage.deleteBookBookmark(user.id, req.params.id);
      return res.json({ bookmarked: false });
    }
    await storage.createBookBookmark(user.id, req.params.id);
    return res.json({ bookmarked: true });
  });

  app.get("/api/user/book-bookmarks", requireAuth, async (req, res) => {
    const user = req.user as any;
    const bms = await storage.getUserBookBookmarks(user.id);
    res.json(bms);
  });

  app.get("/api/user/motivational-bookmarks", requireAuth, async (req: any, res) => {
    const bms = await storage.getMotivationalBookmarks(req.user.id);
    res.json(bms);
  });

  app.get("/api/books/:id/progress", requireAuth, async (req, res) => {
    const user = req.user as any;
    const progress = await storage.getBookProgress(user.id, req.params.id);
    res.json(progress || null);
  });

  app.post("/api/books/:id/progress", requireAuth, async (req, res) => {
    const user = req.user as any;
    const { lastChapterId, lastPage } = req.body;
    const progress = await storage.upsertBookProgress(user.id, req.params.id, lastChapterId || null, lastPage || 1);
    res.json(progress);
  });

  app.get("/api/books/:id/ratings", async (req, res) => {
    const ratings = await storage.getBookRatings(req.params.id);
    res.json(ratings);
  });

  app.get("/api/books/:id/my-rating", requireAuth, async (req, res) => {
    const user = req.user as any;
    const rating = await storage.getUserBookRating(user.id, req.params.id);
    res.json(rating || null);
  });

  app.post("/api/books/:id/rate", requireAuth, async (req, res) => {
    const parsed = insertBookRatingSchema.safeParse({ ...req.body, bookId: req.params.id });
    if (!parsed.success) return res.status(400).json({ message: "Invalid rating data" });

    const user = req.user as any;
    const rating = await storage.createBookRating(user.id, parsed.data.bookId, parsed.data.rating, parsed.data.comment);
    res.json(rating);
  });

  // Admin Books routes
  app.get("/api/admin/books/stats", requireStaff, async (req, res) => {
    const uid = resolveContentUserId(req);
    const incNull = req.query.includeNullUser === "true";
    const stats = await storage.getBooksAdminStats(uid, incNull);
    res.json(stats);
  });

  app.get("/api/admin/books/categories", requireStaff, async (_req, res) => {
    const cats = await storage.getBookCategoriesAdmin();
    res.json(cats);
  });

  app.get("/api/admin/books", requireStaff, async (req, res) => {
    const { type, category, search, sort, published, userId, includeNullUser, startDate, endDate, limit, offset } = req.query;
    const result = await storage.getBooksAdmin({
      type: type as string,
      category: category as string,
      search: search as string,
      sort: sort as string,
      published: published === "true" ? true : published === "false" ? false : undefined,
      userId: (resolveContentUserId(req) ?? userId) as string | undefined,
      includeNullUser: includeNullUser === "true",
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json(result);
  });

  app.patch("/api/admin/books/:id/publish", requireStaff, async (req, res) => {
    const { published } = req.body;
    const updated = await storage.updateBook(req.params.id, { published });
    if (!updated) return res.status(404).json({ message: "Book not found" });
    res.json(updated);
  });

  app.patch("/api/admin/books/:id/active", requireAdmin, async (req, res) => {
    const { isActive } = req.body;
    const updated = await storage.updateBook(req.params.id, { isActive });
    if (!updated) return res.status(404).json({ message: "Book not found" });
    res.json(updated);
  });

  app.patch("/api/admin/books/:id/ad-slots", requireAdmin, async (req, res) => {
    const { adSlots } = req.body;
    const updated = await storage.updateBook(req.params.id, { adSlots: JSON.stringify(adSlots) });
    if (!updated) return res.status(404).json({ message: "Book not found" });
    res.json(updated);
  });

  // Story Parts & Pages - Public routes
  app.get("/api/stories/:id/parts", async (req, res) => {
    const parts = await storage.getStoryParts(req.params.id);
    res.json(parts);
  });

  app.get("/api/stories/:id/reading-progress", requireAuth, async (req: any, res) => {
    const progress = await storage.getStoryReadingProgress(req.user.id, req.params.id);
    res.json(progress || null);
  });

  app.post("/api/stories/:id/reading-progress", requireAuth, async (req: any, res) => {
    const { lastPartId, lastPageIndex } = req.body;
    if (!lastPartId || typeof lastPartId !== "string" || typeof lastPageIndex !== "number" || lastPageIndex < 0) {
      return res.status(400).json({ message: "Invalid lastPartId or lastPageIndex" });
    }
    const part = await storage.getStoryPartById(lastPartId);
    if (!part || part.storyId !== req.params.id) {
      return res.status(400).json({ message: "Part does not belong to this story" });
    }
    const progress = await storage.upsertStoryReadingProgress(req.user.id, req.params.id, lastPartId, lastPageIndex);
    res.json(progress);
  });

  // Story Parts & Pages - Admin routes
  app.get("/api/admin/stories/:storyId/parts", requireStaff, async (req, res) => {
    const parts = await storage.getStoryParts(req.params.storyId);
    res.json(parts);
  });

  app.post("/api/admin/stories/:storyId/parts", requireStaff, async (req, res) => {
    const parsed = insertStoryPartSchema.safeParse({ ...req.body, storyId: req.params.storyId });
    if (!parsed.success) return res.status(400).json({ message: "Invalid part data", errors: parsed.error.errors });
    const part = await storage.createStoryPart(parsed.data);
    res.json(part);
  });

  app.patch("/api/admin/stories/parts/:id", requireStaff, async (req, res) => {
    const allowed = ["title", "summary", "coverImage", "videoUrl", "audioUrl", "orderIndex"];
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in req.body) data[key] = req.body[key];
    }
    const updated = await storage.updateStoryPart(req.params.id, data);
    if (!updated) return res.status(404).json({ message: "Part not found" });
    res.json(updated);
  });

  app.delete("/api/admin/stories/parts/:id", requireStaff, async (req, res) => {
    const ok = await storage.deleteStoryPart(req.params.id);
    if (!ok) return res.status(404).json({ message: "Part not found" });
    res.json({ success: true });
  });

  app.post("/api/admin/stories/parts/:id/duplicate", requireStaff, async (req, res) => {
    const part = await storage.getStoryPartById(req.params.id);
    if (!part) return res.status(404).json({ message: "Part not found" });
    const newPart = await storage.duplicateStoryPart(req.params.id, part.storyId);
    res.status(201).json(newPart);
  });

  app.post("/api/admin/stories/parts/:partId/pages", requireStaff, async (req, res) => {
    const parsed = insertStoryPageSchema.safeParse({ ...req.body, partId: req.params.partId });
    if (!parsed.success) return res.status(400).json({ message: "Invalid page data", errors: parsed.error.errors });
    const page = await storage.createStoryPage(parsed.data);
    res.json(page);
  });

  app.patch("/api/admin/stories/pages/:id", requireStaff, async (req, res) => {
    const data: Record<string, any> = {};
    if ("content" in req.body) data.content = req.body.content;
    if ("orderIndex" in req.body) data.orderIndex = req.body.orderIndex;
    const updated = await storage.updateStoryPage(req.params.id, data);
    if (!updated) return res.status(404).json({ message: "Page not found" });
    res.json(updated);
  });

  app.delete("/api/admin/stories/pages/:id", requireStaff, async (req, res) => {
    const ok = await storage.deleteStoryPage(req.params.id);
    if (!ok) return res.status(404).json({ message: "Page not found" });
    res.json({ success: true });
  });

  app.post("/api/admin/stories/pages/:id/duplicate", requireStaff, async (req, res) => {
    const newPage = await storage.duplicateStoryPage(req.params.id);
    res.json(newPage);
  });

  app.get("/api/motivational-stories", async (req, res) => {
    const { category, search, sort, limit, offset } = req.query;
    const result = await storage.getMotivationalStories({
      category: category as string,
      search: search as string,
      sort: sort as string,
      published: true,
      activeOnly: true,
      limit: limit ? parseInt(limit as string) : 12,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json(result);
  });

  app.get("/api/motivational-stories/categories", async (_req, res) => {
    const categories = await storage.getMotivationalCategories();
    res.json(categories);
  });

  app.get("/api/motivational-stories/popular", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
    const stories = await storage.getPopularMotivationalStories(limit);
    res.json(stories);
  });

  app.get("/api/motivational-stories/slug/:slug", async (req: any, res) => {
    const story = await storage.getMotivationalStoryBySlug(req.params.slug);
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);
    if (!story || !story.published || (!isStaff && !story.isActive)) return res.status(404).json({ message: "Story not found" });
    res.json(story);
  });

  app.post("/api/motivational-stories/:id/view", async (req, res) => {
    await storage.incrementMotivationalViews(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/motivational-stories/:id/bookmark", requireAuth, async (req: any, res) => {
    const bookmarked = await storage.toggleMotivationalBookmark(req.user.id, req.params.id);
    res.json({ bookmarked });
  });

  app.get("/api/motivational-stories/:id/bookmark", requireAuth, async (req: any, res) => {
    const bookmarked = await storage.isMotivationalBookmarked(req.user.id, req.params.id);
    res.json({ bookmarked });
  });

  app.post("/api/duas/:id/bookmark", requireAuth, async (req: any, res) => {
    const bookmarked = await storage.toggleDuaBookmark(req.user.id, req.params.id);
    res.json({ bookmarked });
  });

  app.get("/api/duas/:id/bookmark", requireAuth, async (req: any, res) => {
    const bookmarked = await storage.isDuaBookmarked(req.user.id, req.params.id);
    res.json({ bookmarked });
  });

  app.get("/api/user/dua-bookmarks", requireAuth, async (req: any, res) => {
    const bms = await storage.getDuaBookmarks(req.user.id);
    res.json(bms);
  });

  app.get("/api/duas/:id/ratings", async (req, res) => {
    const ratings = await storage.getDuaRatings(req.params.id);
    res.json(ratings);
  });

  app.get("/api/duas/:id/my-rating", requireAuth, async (req: any, res) => {
    const rating = await storage.getUserDuaRating(req.user.id, req.params.id);
    res.json(rating || null);
  });

  app.post("/api/duas/:id/rate", requireAuth, async (req: any, res) => {
    const parsed = insertDuaRatingSchema.safeParse({ ...req.body, duaId: req.params.id });
    if (!parsed.success) return res.status(400).json({ message: "Invalid rating data" });
    const rating = await storage.createDuaRating(req.user.id, parsed.data.duaId, parsed.data.rating, parsed.data.comment);
    res.json(rating);
  });

  app.get("/api/stories/:id/ratings", async (req, res) => {
    const ratings = await storage.getStoryRatings(req.params.id);
    res.json(ratings);
  });

  app.get("/api/stories/:id/my-rating", requireAuth, async (req: any, res) => {
    const rating = await storage.getUserStoryRating(req.user.id, req.params.id);
    res.json(rating || null);
  });

  app.post("/api/stories/:id/rate", requireAuth, async (req: any, res) => {
    const parsed = insertStoryRatingSchema.safeParse({ ...req.body, storyId: req.params.id });
    if (!parsed.success) return res.status(400).json({ message: "Invalid rating data" });
    const rating = await storage.createStoryRating(req.user.id, parsed.data.storyId, parsed.data.rating, parsed.data.comment);
    res.json(rating);
  });

  app.post("/api/motivational-stories/:id/rate", requireAuth, async (req: any, res) => {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5" });
    const result = await storage.createMotivationalRating(req.user.id, req.params.id, rating, comment);
    res.json(result);
  });

  app.get("/api/motivational-stories/:id/ratings", async (req, res) => {
    const ratings = await storage.getMotivationalRatings(req.params.id);
    res.json(ratings);
  });

  app.get("/api/motivational-stories/:id/progress", requireAuth, async (req: any, res) => {
    const progress = await storage.getMotivationalProgress(req.user.id, req.params.id);
    res.json(progress || null);
  });

  app.post("/api/motivational-stories/:id/progress", requireAuth, async (req: any, res) => {
    const { lastLessonId } = req.body;
    if (!lastLessonId) return res.status(400).json({ message: "lastLessonId required" });
    const progress = await storage.upsertMotivationalProgress(req.user.id, req.params.id, lastLessonId);
    res.json(progress);
  });

  app.get("/api/motivational-stories/:id/related", async (req, res) => {
    const story = await storage.getMotivationalStoryById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    const related = await storage.getRelatedMotivationalStories(req.params.id, story.category);
    res.json(related);
  });

  app.get("/api/admin/motivational-stories/stats", requireStaff, async (req, res) => {
    const uid = resolveContentUserId(req);
    const incNull = req.query.includeNullUser === "true";
    const [total, published, totalViews, recentCount, ratingDist] = await Promise.all([
      storage.getMotivationalStoryCount(undefined, uid, incNull),
      storage.getMotivationalStoryCount(true, uid, incNull),
      storage.getMotivationalTotalViews(uid, incNull),
      storage.getRecentMotivationalCount(30, uid, incNull),
      storage.getMotivationalRatingDistribution(uid, incNull),
    ]);
    res.json({ total, published, totalViews, recentCount, ...ratingDist });
  });

  app.get("/api/admin/motivational-stories", requireStaff, async (req, res) => {
    const { category, search, sort, limit, offset, userId, includeNullUser, startDate, endDate } = req.query;
    const result = await storage.getMotivationalStories({
      category: category as string,
      search: search as string,
      sort: sort as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
      userId: (resolveContentUserId(req) ?? userId) as string | undefined,
      includeNullUser: includeNullUser === "true",
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });
    res.json(result);
  });

  app.get("/api/admin/motivational-stories/categories", requireStaff, async (_req, res) => {
    const categories = await storage.getMotivationalCategoriesAdmin();
    res.json(categories);
  });

  app.get("/api/admin/motivational-stories/:id", requireStaff, async (req, res) => {
    const story = await storage.getMotivationalStoryById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    res.json(story);
  });

  app.post("/api/admin/motivational-stories", requireStaff, async (req, res) => {
    const body = { ...req.body };
    if ((req as any).session?.userId) body.userId = (req as any).session.userId;
    const parsed = insertMotivationalStorySchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const story = await storage.createMotivationalStory(parsed.data);
    res.json(story);
  });

  app.patch("/api/admin/motivational-stories/:id", requireStaff, async (req, res) => {
    const parsed = insertMotivationalStorySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const story = await storage.updateMotivationalStory(req.params.id, parsed.data);
    if (!story) return res.status(404).json({ message: "Story not found" });
    res.json(story);
  });

  app.patch("/api/admin/motivational-stories/:id/active", requireAdmin, async (req, res) => {
    const { isActive } = req.body;
    const updated = await storage.updateMotivationalStory(req.params.id, { isActive });
    if (!updated) return res.status(404).json({ message: "Story not found" });
    res.json(updated);
  });

  app.patch("/api/admin/motivational-stories/:id/ad-slots", requireAdmin, async (req, res) => {
    const { adSlots } = req.body;
    const updated = await storage.updateMotivationalStory(req.params.id, { adSlots: JSON.stringify(adSlots) });
    if (!updated) return res.status(404).json({ message: "Story not found" });
    res.json(updated);
  });

  app.delete("/api/admin/motivational-stories/:id", requireStaff, async (req, res) => {
    await storage.deleteMotivationalStory(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/motivational-stories/:id/duplicate", requireStaff, async (req, res) => {
    try {
      const newStory = await storage.duplicateMotivationalStory(req.params.id);
      res.status(201).json(newStory);
    } catch (e: any) {
      res.status(404).json({ message: e.message });
    }
  });

  app.post("/api/admin/motivational-stories/:id/lessons", requireStaff, async (req, res) => {
    const parsed = insertMotivationalLessonSchema.safeParse({ ...req.body, storyId: req.params.id });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const lesson = await storage.createMotivationalLesson(parsed.data);
    res.json(lesson);
  });

  app.patch("/api/admin/motivational-stories/:id/lessons/:lessonId", requireStaff, async (req, res) => {
    const parsed = insertMotivationalLessonSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    const lesson = await storage.updateMotivationalLesson(req.params.lessonId, parsed.data);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json(lesson);
  });

  app.delete("/api/admin/motivational-stories/:id/lessons/:lessonId", requireStaff, async (req, res) => {
    await storage.deleteMotivationalLesson(req.params.lessonId);
    res.json({ success: true });
  });

  app.get("/api/settings/public", async (_req, res) => {
    const settings = await storage.getAllSettings();
    const { googleClientSecret: _secret, emailSenderPassword: _pass, smtpPass: _smtpPass, ...publicSettings } = settings;
    res.json(publicSettings);
  });

  app.get("/api/admin/settings", requireStaff, async (_req, res) => {
    const settings = await storage.getAllSettings();
    const result: Record<string, string> = { ...settings };
    if (result.googleClientSecret && result.googleClientSecret.includes(":")) {
      result.googleClientSecret = "••••••••";
    }
    res.json(result);
  });

  app.patch("/api/admin/settings", requireStaff, async (req, res) => {
    const { key, value } = req.body;
    if (!key || typeof key !== "string") return res.status(400).json({ message: "Invalid key" });
    let storedValue = value || "";
    if (key === "googleClientSecret" && storedValue && storedValue !== "••••••••") {
      storedValue = encryptSecret(storedValue);
    }
    await storage.setSetting(key, storedValue);
    res.json({ success: true });
  });

  app.get("/api/admin/trash", requireStaff, async (_req, res) => {
    const [categories, stories, books, motivationalStories] = await Promise.all([
      storage.getDeletedCategories(),
      storage.getDeletedStories(),
      storage.getDeletedBooks(),
      storage.getDeletedMotivationalStories(),
    ]);
    res.json({ categories, stories, books, motivationalStories });
  });

  app.post("/api/admin/trash/restore/:type/:id", requireStaff, async (req, res) => {
    const { type, id } = req.params;
    let ok = false;
    if (type === "category") ok = await storage.restoreCategory(id);
    else if (type === "story") ok = await storage.restoreStory(id);
    else if (type === "book") ok = await storage.restoreBook(id);
    else if (type === "motivational-story") ok = await storage.restoreMotivationalStory(id);
    else return res.status(400).json({ message: "Unknown type" });
    if (!ok) return res.status(404).json({ message: "Item not found" });
    res.json({ success: true });
  });

  app.delete("/api/admin/trash/permanent/:type/:id", requireStaff, async (req, res) => {
    const { type, id } = req.params;
    let ok = false;
    if (type === "category") ok = await storage.permanentDeleteCategory(id);
    else if (type === "story") ok = await storage.permanentDeleteStory(id);
    else if (type === "book") ok = await storage.permanentDeleteBook(id);
    else if (type === "motivational-story") ok = await storage.permanentDeleteMotivationalStory(id);
    else return res.status(400).json({ message: "Unknown type" });
    if (!ok) return res.status(404).json({ message: "Item not found" });
    res.json({ success: true });
  });

  // ── Admin: User Management ─────────────────────────────────────────
  app.get("/api/admin/users/stats", requireAdmin, async (_req, res) => {
    const stats = await storage.getUsersStats();
    res.json(stats);
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const { search, activeFilter, sort, startDate, endDate } = req.query as Record<string, string>;
    const result = await storage.getUsersFiltered({ search, activeFilter, sort, startDate, endDate, limit: 200 });
    res.json({
      users: result.users.map(u => ({
        id: u.id, username: u.username, email: u.email, name: u.name,
        role: u.role, createdAt: u.createdAt, plainPassword: u.plainPassword ?? null,
        lastReadAt: u.lastReadAt,
      })),
      total: result.total,
    });
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    const updateData: any = { name, email, role };
    if (password) {
      updateData.password = await hashPassword(password);
      updateData.plainPassword = password;
    }
    const updated = await storage.updateUser(id, updateData);
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json({
      id: updated.id, username: updated.username, email: updated.email,
      name: updated.name, role: updated.role, plainPassword: updated.plainPassword ?? null,
    });
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user as any;
    if (currentUser.id === id) return res.status(400).json({ message: "Cannot delete your own account" });
    const ok = await storage.deleteUser(id);
    if (!ok) return res.status(404).json({ message: "User not found" });
    res.json({ success: true });
  });

  // ── Admin: Contributors (Owner / Admin / Moderator / Editor) ───────
  const CONTRIBUTOR_ROLES = ["super_owner", "owner", "admin", "moderator", "editor"];

  function visibleRolesFor(role: string): string[] {
    if (role === "super_owner") return ["super_owner", "owner", "admin", "moderator", "editor"];
    if (role === "owner") return ["admin", "moderator", "editor"];
    if (role === "admin") return ["moderator", "editor"];
    return [];
  }

  app.get("/api/admin/contributors/stats", requireAdmin, async (req, res) => {
    const currentRole = (req.user as any)?.role;
    const roles = visibleRolesFor(currentRole);
    if (roles.length === 0) return res.json({ superOwnerCount: 0, adminCount: 0, moderatorCount: 0, editorCount: 0, total: 0 });
    const placeholders = roles.map((_, i) => `$${i + 1}`).join(",");
    const result = await pool.query(
      `SELECT role, COUNT(*)::int AS c FROM users WHERE role IN (${placeholders}) GROUP BY role`,
      roles
    );
    const map: Record<string, number> = {};
    for (const row of result.rows) map[row.role] = row.c;
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    res.json({
      superOwnerCount: map.super_owner ?? 0,
      ownerCount: map.owner ?? 0,
      adminCount: map.admin ?? 0,
      moderatorCount: map.moderator ?? 0,
      editorCount: map.editor ?? 0,
      total,
    });
  });

  app.get("/api/admin/moderators", requireAdmin, async (req, res) => {
    const currentRole = (req.user as any)?.role;
    const roles = visibleRolesFor(currentRole);
    if (roles.length === 0) return res.json([]);
    const placeholders = roles.map((_, i) => `$${i + 1}`).join(",");
    const result = await pool.query(
      `SELECT id, username, email, name, role, permissions, plain_password, created_at FROM users WHERE role IN (${placeholders}) ORDER BY created_at ASC`,
      roles
    );
    res.json(result.rows.map((u: any) => ({
      id: u.id, username: u.username, email: u.email, name: u.name,
      role: u.role, permissions: u.permissions || [], plainPassword: u.plain_password,
      createdAt: u.created_at,
    })));
  });

  app.post("/api/admin/moderators", requireAdmin, async (req, res) => {
    const currentUser = req.user as any;
    const { email, password, name, permissions, role: reqRole } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ message: "An account with this email already exists" });
    if (reqRole && (reqRole === "owner" || reqRole === "super_owner") && currentUser.role !== "super_owner") {
      return res.status(403).json({ message: "Only the Super Owner can create an Owner account" });
    }
    const role = CONTRIBUTOR_ROLES.includes(reqRole) ? reqRole : "moderator";
    const suffix = role === "super_owner" ? "superowner" : role === "admin" ? "admin" : role === "owner" ? "owner" : role === "editor" ? "ed" : "mod";
    const username = email.split("@")[0] + `-${suffix}-` + randomBytes(3).toString("hex");
    const hashedPass = await hashPassword(password);
    const user = await storage.createUserWithEmail({
      email, password: hashedPass, name: name || null, username, role,
      permissions: permissions || [], plainPassword: password,
    });
    res.json({
      id: user.id, username: user.username, email: user.email, name: user.name,
      role: user.role, permissions: user.permissions || [], plainPassword: user.plainPassword,
      createdAt: user.createdAt,
    });
  });

  app.patch("/api/admin/moderators/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user as any;
    const { name, email, password, permissions, role } = req.body;
    const target = await storage.getUser(id);
    if (!target) return res.status(404).json({ message: "Contributor not found" });
    if (target.role === "super_owner" && currentUser.role !== "super_owner") {
      return res.status(403).json({ message: "Only the Super Owner can modify a Super Owner account" });
    }
    if (target.role === "owner" && currentUser.role !== "super_owner") {
      return res.status(403).json({ message: "Only the Super Owner can modify an Owner account" });
    }
    if (role && (role === "owner" || role === "super_owner") && currentUser.role !== "super_owner") {
      return res.status(403).json({ message: "Only the Super Owner can assign the Owner or Super Owner role" });
    }
    const updateData: any = { permissions: permissions || [] };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await hashPassword(password);
      updateData.plainPassword = password;
    }
    const updated = await storage.updateUser(id, updateData);
    if (!updated) return res.status(404).json({ message: "Contributor not found" });
    res.json({
      id: updated.id, username: updated.username, email: updated.email, name: updated.name,
      role: updated.role, permissions: (updated as any).permissions || [], plainPassword: (updated as any).plainPassword,
    });
  });

  app.delete("/api/admin/moderators/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user as any;
    if (currentUser.id === id) return res.status(400).json({ message: "Cannot delete your own account" });
    const target = await storage.getUser(id);
    if (!target) return res.status(404).json({ message: "Contributor not found" });
    if (target.role === "super_owner") {
      return res.status(403).json({ message: "The Super Owner account cannot be deleted" });
    }
    if (target.role === "owner" && currentUser.role !== "super_owner") {
      return res.status(403).json({ message: "Only the Super Owner can delete an Owner account" });
    }
    const ok = await storage.deleteUser(id);
    if (!ok) return res.status(404).json({ message: "Contributor not found" });
    res.json({ success: true });
  });

  app.post("/api/admin/owner/credentials", requireSuperOwner, async (req, res) => {
    const currentUser = req.user as any;
    const { currentEmail, currentPassword, newEmail, newPassword } = req.body;
    if (!currentEmail || !currentPassword) {
      return res.status(400).json({ message: "Current email and password are required for verification" });
    }
    const user = await storage.getUser(currentUser.id);
    if (!user) return res.status(404).json({ message: "Account not found" });
    if (user.email?.toLowerCase() !== currentEmail.toLowerCase()) {
      return res.status(401).json({ message: "Current email is incorrect" });
    }
    if (!user.password) {
      return res.status(400).json({ message: "Cannot verify password for this account type" });
    }
    const match = await comparePasswords(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: "Current password is incorrect" });
    const updateData: any = {};
    if (newEmail && newEmail !== user.email) {
      const existing = await storage.getUserByEmail(newEmail);
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ message: "That email is already in use by another account" });
      }
      updateData.email = newEmail;
    }
    if (newPassword) {
      if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
      updateData.password = await hashPassword(newPassword);
      updateData.plainPassword = newPassword;
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No changes to apply" });
    }
    await storage.updateUser(user.id, updateData);
    res.json({ message: "Credentials updated successfully" });
  });

  // Public Duas
  app.get("/api/duas", async (req, res) => {
    const { search, category, sort, limit, offset } = req.query;
    const result = await storage.getDuas({ published: true, activeOnly: true, search: search as string, category: category as string, sort: sort as string, limit: limit ? Number(limit) : 12, offset: offset ? Number(offset) : 0 });
    res.json(result);
  });

  app.get("/api/duas/categories", async (_req, res) => {
    const categories = await storage.getDuaCategories();
    res.json(categories);
  });

  app.get("/api/duas/popular", async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 4;
    const result = await storage.getDuas({ published: true, sort: "most-viewed", limit });
    res.json(result.duas);
  });

  app.get("/api/duas/:slug", async (req: any, res) => {
    const dua = await storage.getDuaBySlug(req.params.slug);
    const isStaff = req.isAuthenticated?.() && req.user && ["super_owner", "owner", "admin", "moderator", "editor"].includes((req.user as any).role);
    if (!dua || !dua.published || (!isStaff && !dua.isActive)) return res.status(404).json({ message: "Dua not found" });
    await storage.incrementDuaViews(dua.id);
    res.json(dua);
  });

  app.get("/api/duas/:id/related", async (req, res) => {
    const dua = await storage.getDuaById(req.params.id);
    if (!dua) return res.status(404).json({ message: "Dua not found" });
    const { duas: sameCat } = await storage.getDuas({
      category: dua.category ?? undefined,
      published: true,
      limit: 5,
    });
    const related = sameCat.filter((d) => d.id !== dua.id).slice(0, 3);
    if (related.length < 3) {
      const needed = 3 - related.length;
      const excluded = new Set([dua.id, ...related.map((r) => r.id)]);
      const { duas: topViewed } = await storage.getDuas({
        published: true,
        sort: "most-viewed",
        limit: needed + excluded.size + 2,
      });
      const filler = topViewed.filter((d) => !excluded.has(d.id)).slice(0, needed);
      related.push(...filler);
    }
    res.json(related);
  });

  // Admin Duas
  app.get("/api/admin/duas/stats", requireStaff, async (req, res) => {
    const uid = resolveContentUserId(req);
    const incNull = req.query.includeNullUser === "true";
    const [total, published, totalViews, recentCount, ratingDist] = await Promise.all([
      storage.getDuas({ limit: 0, userId: uid, includeNullUser: incNull }).then(r => r.total),
      storage.getDuas({ published: true, limit: 0, userId: uid, includeNullUser: incNull }).then(r => r.total),
      storage.getDuaTotalViews(uid, incNull),
      storage.getRecentDuaCount(30, uid, incNull),
      storage.getDuaRatingDistribution(uid, incNull),
    ]);
    res.json({ total, published, totalViews, recentCount, ...ratingDist });
  });

  app.get("/api/admin/duas/categories", requireStaff, async (_req, res) => {
    const categories = await storage.getDuaCategoriesAdmin();
    res.json(categories);
  });

  app.get("/api/admin/duas", requireStaff, async (req, res) => {
    const { search, category, sort, limit, offset, userId, includeNullUser, startDate, endDate } = req.query;
    const result = await storage.getDuas({
      search: search as string,
      category: category as string,
      sort: sort as string,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      userId: (resolveContentUserId(req) ?? userId) as string | undefined,
      includeNullUser: includeNullUser === "true",
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });
    res.json(result);
  });

  app.post("/api/admin/duas", requireStaff, async (req, res) => {
    const { title, slug, description, thumbnail, category, orderIndex, published } = req.body;
    if (!title || !slug) return res.status(400).json({ message: "Title and slug are required" });
    const userId = (req as any).session?.userId ?? null;
    const dua = await storage.createDua({ title, slug, description, thumbnail, category, orderIndex: orderIndex ?? 0, published: published ?? false, userId });
    res.json(dua);
  });

  app.patch("/api/admin/duas/:id", requireStaff, async (req, res) => {
    const { title, slug, description, thumbnail, category, orderIndex, published } = req.body;
    const dua = await storage.updateDua(req.params.id, { title, slug, description, thumbnail, category, orderIndex, published });
    if (!dua) return res.status(404).json({ message: "Dua not found" });
    res.json(dua);
  });

  app.patch("/api/admin/duas/:id/active", requireAdmin, async (req, res) => {
    const { isActive } = req.body;
    const updated = await storage.updateDua(req.params.id, { isActive });
    if (!updated) return res.status(404).json({ message: "Dua not found" });
    res.json(updated);
  });

  app.patch("/api/admin/duas/:id/ad-slots", requireAdmin, async (req, res) => {
    const { adSlots } = req.body;
    const updated = await storage.updateDua(req.params.id, { adSlots: JSON.stringify(adSlots) });
    if (!updated) return res.status(404).json({ message: "Dua not found" });
    res.json(updated);
  });

  app.delete("/api/admin/duas/:id", requireStaff, async (req, res) => {
    const ok = await storage.deleteDua(req.params.id);
    if (!ok) return res.status(404).json({ message: "Dua not found" });
    res.json({ success: true });
  });

  app.get("/api/admin/duas/:id", requireStaff, async (req, res) => {
    const dua = await storage.getDuaById(req.params.id);
    if (!dua) return res.status(404).json({ message: "Dua not found" });
    res.json(dua);
  });

  // Dua Parts
  app.post("/api/admin/duas/:id/parts", requireStaff, async (req, res) => {
    const { title, arabicText, transliteration, translation, explanation, orderIndex } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    const parts = await storage.getDuaParts(req.params.id);
    const part = await storage.createDuaPart({ duaId: req.params.id, title, arabicText, transliteration, translation, explanation, orderIndex: orderIndex ?? parts.length });
    res.json(part);
  });

  app.patch("/api/admin/dua-parts/:id", requireStaff, async (req, res) => {
    const { title, arabicText, transliteration, translation, explanation, orderIndex } = req.body;
    const part = await storage.updateDuaPart(req.params.id, { title, arabicText, transliteration, translation, explanation, orderIndex });
    if (!part) return res.status(404).json({ message: "Part not found" });
    res.json(part);
  });

  app.delete("/api/admin/dua-parts/:id", requireStaff, async (req, res) => {
    const ok = await storage.deleteDuaPart(req.params.id);
    if (!ok) return res.status(404).json({ message: "Part not found" });
    res.json({ success: true });
  });

  app.post("/api/admin/duas/:id/duplicate", requireStaff, async (req, res) => {
    try {
      const dua = await storage.duplicateDua(req.params.id);
      res.json(dua);
    } catch (err: any) {
      res.status(404).json({ message: err.message ?? "Dua not found" });
    }
  });

  app.post("/api/admin/duas/:id/reorder-parts", requireStaff, async (req, res) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: "orderedIds must be an array" });
    await storage.reorderDuaParts(req.params.id, orderedIds);
    res.json({ success: true });
  });

  // Public footer pages
  app.get("/api/footer-pages", async (req, res) => {
    const pages = await storage.getFooterPages(true);
    res.json(pages);
  });

  app.get("/api/footer-pages/:slug", async (req, res) => {
    const page = await storage.getFooterPageBySlug(req.params.slug);
    if (!page || !page.published) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  });

  // Admin footer pages management
  app.get("/api/admin/footer-pages", requireAdmin, async (req, res) => {
    const pages = await storage.getFooterPages(false);
    res.json(pages);
  });

  app.post("/api/admin/footer-pages", requireAdmin, async (req, res) => {
    const { title, slug, content, orderIndex, published } = req.body;
    if (!title || !slug) return res.status(400).json({ message: "Title and slug are required" });
    const existing = await storage.getFooterPageBySlug(slug);
    if (existing) return res.status(409).json({ message: "A page with this slug already exists" });
    const page = await storage.createFooterPage({ title, slug, content: content || "", orderIndex: orderIndex ?? 0, published: published ?? true });
    res.json(page);
  });

  app.patch("/api/admin/footer-pages/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, slug, content, orderIndex, published } = req.body;
    if (slug) {
      const existing = await storage.getFooterPageBySlug(slug);
      if (existing && existing.id !== id) return res.status(409).json({ message: "A page with this slug already exists" });
    }
    const page = await storage.updateFooterPage(id, { title, slug, content, orderIndex, published });
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  });

  app.delete("/api/admin/footer-pages/:id", requireAdmin, async (req, res) => {
    const ok = await storage.deleteFooterPage(req.params.id);
    if (!ok) return res.status(404).json({ message: "Page not found" });
    res.json({ success: true });
  });

  app.use("/uploads/ads", express.static(adsDir));

  app.get("/api/manual-ads/slot/:slot", async (req, res) => {
    const ad = await storage.getActiveManualAdBySlot(req.params.slot);
    res.json(ad || null);
  });

  app.get("/api/admin/manual-ads", requireAuth, async (req, res) => {
    const { slot } = req.query;
    const ads = await storage.getManualAds(slot as string | undefined);
    res.json(ads);
  });

  app.post("/api/admin/upload/ad-file", requireAuth, adFileUpload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = `/uploads/ads/${req.file.filename}`;
    res.json({ url });
  });

  app.post("/api/admin/manual-ads", requireAuth, async (req, res) => {
    const { name, slot, type, fileUrl, htmlCode, linkUrl, altText, isActive, sortOrder } = req.body;
    if (!name || !slot || !type) return res.status(400).json({ message: "name, slot, and type are required" });
    const ad = await storage.createManualAd({ name, slot, type, fileUrl, htmlCode, linkUrl, altText, isActive: isActive !== false, sortOrder: sortOrder ?? 0 });
    res.json(ad);
  });

  app.patch("/api/admin/manual-ads/:id", requireAuth, async (req, res) => {
    const { name, slot, type, fileUrl, htmlCode, linkUrl, altText, isActive, sortOrder } = req.body;
    const ad = await storage.updateManualAd(req.params.id, { name, slot, type, fileUrl, htmlCode, linkUrl, altText, isActive, sortOrder });
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    res.json(ad);
  });

  app.delete("/api/admin/manual-ads/:id", requireAuth, async (req, res) => {
    const ok = await storage.deleteManualAd(req.params.id);
    if (!ok) return res.status(404).json({ message: "Ad not found" });
    res.json({ success: true });
  });

  return httpServer;
}
