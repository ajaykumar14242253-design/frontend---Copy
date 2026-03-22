import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "../config/db.js";
import { sendEmail, templates } from "../config/mailer.js";

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role",
      [name, email, passwordHash, role || "staff"]
    );
    const token = signToken({ id: result.rows[0].id, role: result.rows[0].role });
    sendEmail(email, "Welcome to Medicare HMS", templates.welcome(name));
    return res.status(201).json({ success: true, token, user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);
    const token = signToken({ id: user.id, role: user.role });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
    return res.json({ success: true, token, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    return res.json({ success: true, message: "Logged out" });
  } catch (error) {
    return next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Missing refresh token" });
    }
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const token = signToken({ id: decoded.id, role: decoded.role });
    return res.json({ success: true, token });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await query("SELECT id, name FROM users WHERE email = $1", [email]);
    if (!result.rows.length) {
      return res.json({ success: true, message: "If the email exists, reset instructions were sent" });
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30);
    await query("UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3", [resetToken, expires, result.rows[0].id]);
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    sendEmail(email, "Password Reset", templates.passwordReset(link));
    return res.json({ success: true, message: "If the email exists, reset instructions were sent" });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await query(
      "SELECT id, email FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [token]
    );
    if (!result.rows.length) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [passwordHash, result.rows[0].id]
    );
    sendEmail(result.rows[0].email, "Password Updated", "<p>Your password has been updated.</p>");
    return res.json({ success: true, message: "Password updated" });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const result = await query("SELECT id, name, email, role, avatar_url FROM users WHERE id = $1", [req.user.id]);
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar_url } = req.body;
    const result = await query(
      "UPDATE users SET name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, role, avatar_url",
      [name, avatar_url, req.user.id]
    );
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
};
