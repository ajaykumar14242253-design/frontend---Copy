# Core API Scaffolding - Medicare HMS

A production-ready Core API layer for the Hospital Management System.

## Features

- **JWT Authentication** with role-based authorization
- **Unified API Endpoints** under `/api/v1/core`
- **Dashboard & Stats** endpoints
- **Patient, Doctor, Appointment** management
- **Integration Tests** with Jest

## API Endpoints

### Authentication Required
All `/api/v1/core/*` routes require Bearer token authentication.

### Available Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v1/core/stats` | Dashboard statistics | admin, doctor |
| GET | `/api/v1/core/dashboard` | Dashboard data | admin, doctor |
| GET | `/api/v1/core/patients` | List all patients | admin, doctor, nurse |
| GET | `/api/v1/core/patients/:id` | Get patient by ID | all |
| POST | `/api/v1/core/patients` | Create patient | admin, doctor |
| PUT | `/api/v1/core/patients/:id` | Update patient | admin, doctor |
| DELETE | `/api/v1/core/patients/:id` | Delete patient | admin |
| GET | `/api/v1/core/doctors` | List all doctors | admin, doctor, nurse |
| GET | `/api/v1/core/doctors/:id` | Get doctor by ID | all |
| POST | `/api/v1/core/doctors` | Create doctor | admin |
| PUT | `/api/v1/core/doctors/:id` | Update doctor | admin |
| DELETE | `/api/v1/core/doctors/:id` | Delete doctor | admin |
| GET | `/api/v1/core/appointments` | List all appointments | admin, doctor, nurse |
| GET | `/api/v1/core/appointments/:id` | Get appointment by ID | all |
| POST | `/api/v1/core/appointments` | Create appointment | all |
| PUT | `/api/v1/core/appointments/:id` | Update appointment | all |
| DELETE | `/api/v1/core/appointments/:id` | Delete appointment | admin, doctor |
| GET | `/api/v1/core/appointments/patient/:patientId` | Patient's appointments | all |
| GET | `/api/v1/core/appointments/doctor/:doctorId` | Doctor's appointments | all |
| GET | `/api/v1/core/reports/appointments-summary` | Appointment stats | admin |

## Running Tests

```bash
# Run all tests
npm test

# Run core API tests
npm run test:core

# Run specific test
npm run test:api
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

## Error Handling

Errors return appropriate HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

See `.env.test` for testing environment configuration.
