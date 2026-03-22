import { query } from "../config/db.js";

const generateDoctorId = async () => {
  const result = await query("SELECT COUNT(*) FROM doctors", []);
  const count = Number(result.rows[0].count) + 1;
  return `DOC-${String(count).padStart(3, "0")}`;
};

export const getAllDoctors = async (req, res, next) => {
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
      where += ` AND (name ILIKE $${idx} OR specialization ILIKE $${idx})`;
    }
    if (status) {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }

    params.push(limit, offset);
    const dataQuery = `SELECT * FROM doctors ${where} ORDER BY ${sortBy} ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const countQuery = `SELECT COUNT(*) FROM doctors ${where}`;

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

export const getDoctorById = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM doctors WHERE id = $1", [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req, res, next) => {
  try {
    const doctorId = await generateDoctorId();
    const { name, specialization, qualification, experience, phone, email, availability, working_hours, rating, bio, status } = req.body;
    const result = await query(
      `INSERT INTO doctors (doctor_id, name, specialization, qualification, experience, phone, email, availability, working_hours, rating, bio, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [doctorId, name, specialization, qualification, experience, phone, email, availability || "Available", working_hours, rating, bio, status || "Active"]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query("SELECT * FROM doctors WHERE id = $1", [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    const data = { ...existing.rows[0], ...req.body };
    const result = await query(
      `UPDATE doctors SET name=$1, specialization=$2, qualification=$3, experience=$4, phone=$5, email=$6, availability=$7, working_hours=$8, rating=$9, bio=$10, status=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [data.name, data.specialization, data.qualification, data.experience, data.phone, data.email, data.availability, data.working_hours, data.rating, data.bio, data.status, id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req, res, next) => {
  try {
    const result = await query("UPDATE doctors SET status = 'Inactive' WHERE id = $1 RETURNING *", [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    return res.json({ success: true, message: "Doctor deactivated" });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAppointments = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT a.*, p.name AS patient_name FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.doctor_id = $1`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getDoctorSchedule = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT working_hours FROM doctors WHERE id = $1",
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    const result = await query("UPDATE doctors SET availability = $1 WHERE id = $2 RETURNING *", [availability, req.params.id]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const uploadDoctorAvatar = async (req, res, next) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await query("UPDATE doctors SET avatar_url = $1 WHERE id = $2 RETURNING *", [fileUrl, req.params.id]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const getDoctorStats = async (req, res, next) => {
  try {
    const total = await query("SELECT COUNT(*) FROM doctors", []);
    const active = await query("SELECT COUNT(*) FROM doctors WHERE status = 'Active'", []);
    return res.json({ success: true, data: { total: Number(total.rows[0].count), active: Number(active.rows[0].count) } });
  } catch (error) {
    next(error);
  }
};
