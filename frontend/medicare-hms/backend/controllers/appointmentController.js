import { query } from "../config/db.js";
import { getIO } from "../config/socket.js";
import { sendEmail, templates } from "../config/mailer.js";

const generateAppointmentId = async () => {
  const result = await query("SELECT COUNT(*) FROM appointments", []);
  const count = Number(result.rows[0].count) + 1;
  return `APT-${String(count).padStart(3, "0")}`;
};

export const getAllAppointments = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sortBy = req.query.sortBy || "appointment_date";
    const order = req.query.order === "asc" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;

    const params = [];
    let where = "WHERE 1=1";
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      where += ` AND (p.name ILIKE $${idx} OR d.name ILIKE $${idx})`;
    }
    if (status) {
      params.push(status);
      where += ` AND a.status = $${params.length}`;
    }

    params.push(limit, offset);
    const dataQuery = `
      SELECT a.*, p.name AS patient_name, d.name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      ${where}
      ORDER BY ${sortBy} ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const countQuery = `
      SELECT COUNT(*)
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      ${where}
    `;

    const [dataResult, countResult] = await Promise.all([
      query(dataQuery, params),
      query(countQuery, params.slice(0, params.length - 2)),
    ]);

    const total = Number(countResult.rows[0].count);
    return res.json({
      success: true,
      data: dataResult.rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, p.name AS patient_name, d.name AS doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const checkConflict = async (req, res, next) => {
  try {
    const { doctor_id, appointment_date } = req.body;
    const result = await query(
      "SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2",
      [doctor_id, appointment_date]
    );
    return res.json({ success: true, conflict: result.rows.length > 0 });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const appointmentId = await generateAppointmentId();
    const { patient_id, doctor_id, appointment_date, duration, type, status, notes, symptoms, prescription, follow_up_date } = req.body;
    const result = await query(
      `INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, duration, type, status, notes, symptoms, prescription, follow_up_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [appointmentId, patient_id, doctor_id, appointment_date, duration || 30, type, status || "Scheduled", notes, symptoms, prescription, follow_up_date, req.user?.id]
    );
    const io = getIO();
    io?.emit("appointment:created", result.rows[0]);
    sendEmail(req.body?.email || "", "Appointment Confirmation", templates.appointmentConfirmation("Your appointment is confirmed."));
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query("SELECT * FROM appointments WHERE id = $1", [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }
    const data = { ...existing.rows[0], ...req.body };
    const result = await query(
      `UPDATE appointments SET patient_id=$1, doctor_id=$2, appointment_date=$3, duration=$4, type=$5, status=$6, notes=$7, symptoms=$8, prescription=$9, follow_up_date=$10, updated_at=NOW() WHERE id=$11 RETURNING *`,
      [data.patient_id, data.doctor_id, data.appointment_date, data.duration, data.type, data.status, data.notes, data.symptoms, data.prescription, data.follow_up_date, id]
    );
    const io = getIO();
    io?.emit("appointment:updated", result.rows[0]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await query("UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *", [status, req.params.id]);
    const io = getIO();
    if (status === "Cancelled") {
      io?.emit("appointment:cancelled", result.rows[0]);
    } else {
      io?.emit("appointment:updated", result.rows[0]);
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const getTodayAppointments = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM appointments WHERE appointment_date::date = CURRENT_DATE", []);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingAppointments = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM appointments WHERE appointment_date > NOW() ORDER BY appointment_date ASC", []);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
