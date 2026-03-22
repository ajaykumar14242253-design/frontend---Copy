import { query } from "../config/db.js";
import { getIO } from "../config/socket.js";

const generatePatientId = async () => {
  const result = await query("SELECT COUNT(*) FROM patients", []);
  const count = Number(result.rows[0].count) + 1;
  return `PAT-${String(count).padStart(3, "0")}`;
};

export const getAllPatients = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sortBy = req.query.sortBy || "created_at";
    const order = req.query.order === "asc" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;

    const params = [];
    let where = "WHERE 1=1";
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      where += ` AND (name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`;
    }
    if (status) {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }

    params.push(limit, offset);
    const dataQuery = `SELECT * FROM patients ${where} ORDER BY ${sortBy} ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const countQuery = `SELECT COUNT(*) FROM patients ${where}`;

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

export const getPatientById = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM patients WHERE id = $1", [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const patientId = await generatePatientId();
    const { name, age, dob, gender, blood_type, phone, email, address, emergency_contact, emergency_phone, medical_history, allergies, status } = req.body;
    const result = await query(
      `INSERT INTO patients (patient_id, name, age, dob, gender, blood_type, phone, email, address, emergency_contact, emergency_phone, medical_history, allergies, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [patientId, name, age, dob, gender, blood_type, phone, email, address, emergency_contact, emergency_phone, medical_history, allergies, status || "Active", req.user?.id]
    );
    const io = getIO();
    io?.emit("patient:new", result.rows[0]);
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query("SELECT * FROM patients WHERE id = $1", [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    const data = { ...existing.rows[0], ...req.body };
    const result = await query(
      `UPDATE patients SET name=$1, age=$2, dob=$3, gender=$4, blood_type=$5, phone=$6, email=$7, address=$8, emergency_contact=$9, emergency_phone=$10, medical_history=$11, allergies=$12, status=$13, updated_at=NOW() WHERE id=$14 RETURNING *`,
      [data.name, data.age, data.dob, data.gender, data.blood_type, data.phone, data.email, data.address, data.emergency_contact, data.emergency_phone, data.medical_history, data.allergies, data.status, id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const result = await query("UPDATE patients SET status = 'Inactive' WHERE id = $1 RETURNING *", [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    return res.json({ success: true, message: "Patient deactivated" });
  } catch (error) {
    next(error);
  }
};

export const getPatientAppointments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, d.name AS doctor_name FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getPatientBilling = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.*, d.name AS doctor_name FROM billing b
       JOIN doctors d ON b.doctor_id = d.id
       WHERE b.patient_id = $1`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const uploadPatientAvatar = async (req, res, next) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await query("UPDATE patients SET avatar_url = $1 WHERE id = $2 RETURNING *", [fileUrl, req.params.id]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const getPatientStats = async (req, res, next) => {
  try {
    const total = await query("SELECT COUNT(*) FROM patients", []);
    const active = await query("SELECT COUNT(*) FROM patients WHERE status = 'Active'", []);
    return res.json({ success: true, data: { total: Number(total.rows[0].count), active: Number(active.rows[0].count) } });
  } catch (error) {
    next(error);
  }
};
