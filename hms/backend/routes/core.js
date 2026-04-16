import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as patientController from '../controllers/patientController.js';
import * as doctorController from '../controllers/doctorController.js';
import * as appointmentController from '../controllers/appointmentController.js';
import { query } from '../config/db.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', async (req, res, next) => {
  try {
    const [patientsCount, doctorsCount, appointmentsToday, pendingBills] = await Promise.all([
      query('SELECT COUNT(*) FROM patients WHERE is_deleted = false'),
      query('SELECT COUNT(*) FROM doctors WHERE is_deleted = false'),
      query("SELECT COUNT(*) FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE AND is_deleted = false"),
      query("SELECT COUNT(*) FROM billing WHERE status = 'Pending'"),
    ]);

    res.json({
      success: true,
      data: {
        patients: Number(patientsCount.rows[0].count),
        doctors: Number(doctorsCount.rows[0].count),
        appointmentsToday: Number(appointmentsToday.rows[0].count),
        pendingBills: Number(pendingBills.rows[0].count),
      },
      message: 'Dashboard stats fetched',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const [recentPatients, recentAppointments, todaySchedule, lowStockMeds] = await Promise.all([
      query('SELECT id, patient_code, name, created_at FROM patients WHERE is_deleted = false ORDER BY created_at DESC LIMIT 5'),
      query("SELECT a.id, a.appointment_code, a.appointment_date, a.status, p.name AS patient_name, d.name AS doctor_name FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN doctors d ON d.id = a.doctor_id WHERE a.is_deleted = false ORDER BY a.created_at DESC LIMIT 5"),
      query("SELECT a.id, a.appointment_code, a.appointment_date, a.status, p.name AS patient_name, d.name AS doctor_name FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN doctors d ON d.id = a.doctor_id WHERE DATE(a.appointment_date) = CURRENT_DATE AND a.is_deleted = false ORDER BY a.appointment_date ASC LIMIT 10"),
      query('SELECT id, name, quantity, expiry_date FROM medicines WHERE quantity < 50 ORDER BY quantity ASC LIMIT 5'),
    ]);

    res.json({
      success: true,
      data: {
        recentPatients: recentPatients.rows,
        recentAppointments: recentAppointments.rows,
        todaySchedule: todaySchedule.rows,
        lowStockMedicines: lowStockMeds.rows,
      },
      message: 'Dashboard data fetched',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/patients', authorize(['admin', 'doctor', 'nurse']), patientController.getAllPatients);
router.get('/patients/:id', patientController.getPatientById);
router.post('/patients', authorize(['admin', 'doctor']), patientController.createPatient);
router.put('/patients/:id', authorize(['admin', 'doctor']), patientController.updatePatient);
router.delete('/patients/:id', authorize(['admin']), patientController.deletePatient);
router.get('/patients/profile/me', patientController.getMyProfile);

router.get('/doctors', authorize(['admin', 'doctor', 'nurse']), doctorController.getAllDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);
router.post('/doctors', authorize(['admin']), doctorController.createDoctor);
router.put('/doctors/:id', authorize(['admin']), doctorController.updateDoctor);
router.delete('/doctors/:id', authorize(['admin']), doctorController.deleteDoctor);

router.get('/appointments', authorize(['admin', 'doctor', 'nurse']), appointmentController.getAllAppointments);
router.get('/appointments/:id', appointmentController.getAppointmentById);
router.post('/appointments', appointmentController.createAppointment);
router.put('/appointments/:id', appointmentController.updateAppointment);
router.delete('/appointments/:id', authorize(['admin', 'doctor']), appointmentController.deleteAppointment);

router.get('/appointments/patient/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const result = await query(
      `SELECT a.*, p.name AS patient_name, d.name AS doctor_name 
       FROM appointments a 
       JOIN patients p ON p.id = a.patient_id 
       JOIN doctors d ON d.id = a.doctor_id 
       WHERE a.patient_id = $1 AND a.is_deleted = false 
       ORDER BY a.appointment_date DESC`,
      [patientId]
    );
    res.json({ success: true, data: result.rows, count: result.rows.length, message: 'Patient appointments fetched' });
  } catch (error) {
    next(error);
  }
});

router.get('/appointments/doctor/:doctorId', async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const result = await query(
      `SELECT a.*, p.name AS patient_name, d.name AS doctor_name 
       FROM appointments a 
       JOIN patients p ON p.id = a.patient_id 
       JOIN doctors d ON d.id = a.doctor_id 
       WHERE a.doctor_id = $1 AND a.is_deleted = false 
       ORDER BY a.appointment_date DESC`,
      [doctorId]
    );
    res.json({ success: true, data: result.rows, count: result.rows.length, message: 'Doctor appointments fetched' });
  } catch (error) {
    next(error);
  }
});

router.get('/reports/appointments-summary', authorize(['admin']), async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      params.push(start_date, end_date);
      dateFilter = 'AND DATE(appointment_date) BETWEEN $1 AND $2';
    }

    const result = await query(
      `SELECT 
        status, 
        COUNT(*) AS count 
       FROM appointments 
       WHERE is_deleted = false ${dateFilter}
       GROUP BY status`,
      params
    );

    res.json({ success: true, data: result.rows, message: 'Appointments summary fetched' });
  } catch (error) {
    next(error);
  }
});

export default router;
