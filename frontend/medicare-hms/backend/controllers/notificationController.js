import { query } from "../config/db.js";

export const getNotifications = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const result = await query("UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *", [req.params.id]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
