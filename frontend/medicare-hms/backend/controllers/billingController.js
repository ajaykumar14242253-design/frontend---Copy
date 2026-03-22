import { query } from "../config/db.js";
import { getIO } from "../config/socket.js";
import { sendEmail, templates } from "../config/mailer.js";

const generateInvoiceId = async () => {
  const result = await query("SELECT COUNT(*) FROM billing", []);
  const count = Number(result.rows[0].count) + 1;
  return `INV-${String(count).padStart(3, "0")}`;
};

const calculateTotal = (amount, discount, tax) => Number(amount || 0) - Number(discount || 0) + Number(tax || 0);

export const getAllBilling = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sortBy = req.query.sortBy || "invoice_date";
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
      where += ` AND b.status = $${params.length}`;
    }

    params.push(limit, offset);
    const dataQuery = `
      SELECT b.*, p.name AS patient_name, d.name AS doctor_name
      FROM billing b
      JOIN patients p ON b.patient_id = p.id
      JOIN doctors d ON b.doctor_id = d.id
      ${where}
      ORDER BY ${sortBy} ${order}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const countQuery = `
      SELECT COUNT(*)
      FROM billing b
      JOIN patients p ON b.patient_id = p.id
      JOIN doctors d ON b.doctor_id = d.id
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

export const getBillingById = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM billing WHERE id = $1", [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createBilling = async (req, res, next) => {
  try {
    const invoiceId = await generateInvoiceId();
    const { patient_id, doctor_id, appointment_id, amount, discount, tax, status, payment_method, due_date, notes } = req.body;
    const total = calculateTotal(amount, discount, tax);
    const result = await query(
      `INSERT INTO billing (invoice_id, patient_id, doctor_id, appointment_id, amount, discount, tax, total, status, payment_method, due_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [invoiceId, patient_id, doctor_id, appointment_id, amount, discount || 0, tax || 0, total, status || "Pending", payment_method, due_date, notes, req.user?.id]
    );
    const io = getIO();
    sendEmail(req.body?.email || "", "Invoice Generated", templates.invoiceGenerated("Your invoice is ready."));
    io?.emit("notification:new", result.rows[0]);
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateBilling = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query("SELECT * FROM billing WHERE id = $1", [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    const data = { ...existing.rows[0], ...req.body };
    const total = calculateTotal(data.amount, data.discount, data.tax);
    const result = await query(
      `UPDATE billing SET amount=$1, discount=$2, tax=$3, total=$4, status=$5, payment_method=$6, due_date=$7, paid_at=$8, notes=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [data.amount, data.discount, data.tax, total, data.status, data.payment_method, data.due_date, data.paid_at, data.notes, id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteBilling = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM billing WHERE id = $1 RETURNING *", [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    return res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    next(error);
  }
};

export const markAsPaid = async (req, res, next) => {
  try {
    const result = await query("UPDATE billing SET status = 'Paid', paid_at = NOW() WHERE id = $1 RETURNING *", [req.params.id]);
    const io = getIO();
    io?.emit("billing:paid", result.rows[0]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const getRevenueStats = async (req, res, next) => {
  try {
    const result = await query("SELECT COALESCE(SUM(total),0) AS revenue FROM billing", []);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
