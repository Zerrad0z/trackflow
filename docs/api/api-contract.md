# TrackFlow — API Contract
> Version: 1.0 | Sprint 0 | Status: Draft

## Base URL
```
/api/v1
```

## Authentication
All endpoints (except `/auth/login`) require a JWT token in the header:
```
Authorization: Bearer <token>
```

## Roles
| Role | Code |
|------|------|
| Field Supervisor | `FIELD_SUPERVISOR` |
| Manager | `MANAGER` |
| Admin | `ADMIN` |

---

## 1. Authentication

### POST `/auth/login`
**Access:** Public

**Request:**
```json
{
  "email": "khalid@trackflow.com",
  "password": "secret"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid",
    "full_name": "Khalid Salhi",
    "email": "khalid@trackflow.com",
    "role": "FIELD_SUPERVISOR"
  }
}
```

---

### POST `/auth/logout`
**Access:** Any authenticated user

**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

### GET `/auth/me`
**Access:** Any authenticated user

**Response 200:**
```json
{
  "id": "uuid",
  "full_name": "Khalid Salhi",
  "email": "khalid@trackflow.com",
  "role": "FIELD_SUPERVISOR",
  "is_active": true,
  "created_at": "2026-01-01T10:00:00Z"
}
```

---

## 2. User Management

### GET `/users`
**Access:** ADMIN

**Query params:** `?page=0&size=20&role=FIELD_SUPERVISOR&is_active=true`

**Response 200:**
```json
{
  "content": [
    {
      "id": "uuid",
      "full_name": "Khalid Salhi",
      "email": "khalid@trackflow.com",
      "role": "FIELD_SUPERVISOR",
      "is_active": true,
      "created_at": "2026-01-01T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "total_elements": 45,
  "total_pages": 3
}
```

---

### POST `/users`
**Access:** ADMIN

**Request:**
```json
{
  "full_name": "Hajar Zaimi",
  "email": "hajar@trackflow.com",
  "password": "temp_password",
  "role": "MANAGER"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "full_name": "Hajar Zaimi",
  "email": "hajar@trackflow.com",
  "role": "MANAGER",
  "is_active": true,
  "created_at": "2026-01-01T10:00:00Z"
}
```

---

### GET `/users/{id}`
**Access:** ADMIN

**Response 200:** Same as single user object above.

---

### PUT `/users/{id}`
**Access:** ADMIN

**Request:**
```json
{
  "full_name": "Hajar Zaimi Updated",
  "email": "hajar.updated@trackflow.com"
}
```

**Response 200:** Updated user object.

---

### PATCH `/users/{id}/role`
**Access:** ADMIN

**Request:**
```json
{ "role": "MANAGER" }
```

**Response 200:** Updated user object.

---

### PATCH `/users/{id}/status`
**Access:** ADMIN

**Request:**
```json
{ "is_active": false }
```

**Response 200:** Updated user object.

---

## 3. Forms

### POST `/forms`
**Access:** FIELD_SUPERVISOR

**Request:** `multipart/form-data`
```
file: <scanned image or PDF>
form_type: LETTRE_SOMMATION_BILLET | LETTRE_SOMMATION_CARTE | RAPPORT_M
```

**Response 201:**
```json
{
  "id": "uuid",
  "form_type": "LETTRE_SOMMATION_BILLET",
  "status": "UPLOADED",
  "scan_url": "/files/forms/uuid.pdf",
  "uploaded_by": "uuid",
  "uploaded_at": "2026-01-01T10:00:00Z"
}
```

---

### GET `/forms`
**Access:** FIELD_SUPERVISOR (own forms), MANAGER (all forms)

**Query params:** `?page=0&size=20&status=PENDING_VALIDATION&form_type=RAPPORT_M&from=2026-01-01&to=2026-01-31`

**Response 200:** Paginated list of form objects.

---

### GET `/forms/{id}`
**Access:** FIELD_SUPERVISOR (own), MANAGER

**Response 200:**
```json
{
  "id": "uuid",
  "form_type": "RAPPORT_M",
  "status": "PENDING_CONFIRMATION",
  "scan_url": "/files/forms/uuid.pdf",
  "uploaded_by": {
    "id": "uuid",
    "full_name": "Khalid Salhi"
  },
  "uploaded_at": "2026-01-01T10:00:00Z",
  "confirmed_at": null,
  "confirmed_by": null
}
```

---

### GET `/forms/{id}/fields`
**Access:** FIELD_SUPERVISOR (own), MANAGER

**Response 200:**
```json
[
  {
    "id": "uuid",
    "field_name": "agent_id",
    "extracted_value": "EMP-2024-045",
    "confirmed_value": "EMP-2024-045",
    "status": "ACCEPTED"
  },
  {
    "id": "uuid",
    "field_name": "date",
    "extracted_value": "32/13/2024",
    "confirmed_value": null,
    "status": "PENDING"
  }
]
```

---

### PATCH `/forms/{id}/confirm`
**Access:** FIELD_SUPERVISOR (own forms only)

**Response 200:**
```json
{
  "id": "uuid",
  "status": "CONFIRMED",
  "confirmed_at": "2026-01-01T14:30:00Z",
  "confirmed_by": {
    "id": "uuid",
    "full_name": "Khalid Salhi"
  }
}
```

---

### PATCH `/forms/{id}/archive`
**Access:** FIELD_SUPERVISOR, MANAGER

**Response 200:**
```json
{
  "id": "uuid",
  "status": "ARCHIVED"
}
```

---

### PATCH `/forms/{id}/validate-reject`
**Access:** MANAGER

**Request:**
```json
{
  "decision": "REJECTED",
  "reason": "Incomplete fields in section 2"
}
```

**Response 200:** Updated form object.

---

## 4. AI Validation

### POST `/forms/{id}/validate`
**Access:** FIELD_SUPERVISOR, MANAGER

**Response 202 (Accepted — async):**
```json
{
  "message": "Validation queued",
  "validation_id": "uuid"
}
```
> 202 means the request was accepted but processing happens async via RabbitMQ.

---

### GET `/forms/{id}/validations`
**Access:** FIELD_SUPERVISOR (own), MANAGER

**Response 200:**
```json
[
  {
    "id": "uuid",
    "status": "COMPLETED",
    "is_latest": true,
    "run_at": "2026-01-01T10:05:00Z"
  },
  {
    "id": "uuid",
    "status": "SUPERSEDED",
    "is_latest": false,
    "run_at": "2026-01-01T10:00:00Z"
  }
]
```

---

### GET `/forms/{id}/validations/latest`
**Access:** FIELD_SUPERVISOR (own), MANAGER

**Response 200:**
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "is_latest": true,
  "run_at": "2026-01-01T10:05:00Z",
  "suggestions": [
    {
      "id": "uuid",
      "field_name": "date",
      "extracted_value": "32/13/2024",
      "suggested_value": "02/03/2024",
      "confidence": 0.94,
      "reason": "Invalid date — day 32 does not exist",
      "decision": "PENDING"
    }
  ]
}
```

---

### PATCH `/suggestions/{id}/decide`
**Access:** FIELD_SUPERVISOR

**Request:**
```json
{
  "decision": "ACCEPTED" | "REJECTED" | "OVERRIDDEN",
  "override_value": "02/03/2024"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "decision": "ACCEPTED",
  "decided_at": "2026-01-01T11:00:00Z"
}
```

---

## 5. Reports

### POST `/reports`
**Access:** MANAGER, FIELD_SUPERVISOR

**Request:**
```json
{
  "report_type": "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM",
  "from": "2026-01-01",
  "to": "2026-01-31",
  "format": "PDF" | "EXCEL"
}
```

**Response 202 (Accepted — async):**
```json
{
  "message": "Report generation queued",
  "report_id": "uuid"
}
```

---

### GET `/reports`
**Access:** MANAGER, FIELD_SUPERVISOR

**Query params:** `?page=0&size=20&report_type=MONTHLY`

**Response 200:** Paginated list of report objects.

---

### GET `/reports/{id}/download`
**Access:** MANAGER, FIELD_SUPERVISOR

**Response 200:** File stream (PDF or Excel).

---

## 6. Notifications

### GET `/notifications`
**Access:** Any authenticated user

**Query params:** `?is_read=false&page=0&size=20`

**Response 200:**
```json
{
  "content": [
    {
      "id": "uuid",
      "message": "Form #1234 is ready for review",
      "is_read": false,
      "sent_at": "2026-01-01T10:05:00Z"
    }
  ],
  "unread_count": 3
}
```

---

### PATCH `/notifications/{id}/read`
**Access:** Any authenticated user

**Response 200:**
```json
{ "id": "uuid", "is_read": true }
```

---

### PATCH `/notifications/read-all`
**Access:** Any authenticated user

**Response 200:**
```json
{ "message": "All notifications marked as read" }
```

---

## 7. Audit Logs

### GET `/audit`
**Access:** ADMIN (full), MANAGER (forms only)

**Query params:** `?entity_type=FORM&page=0&size=20&from=2026-01-01&to=2026-01-31`

**Response 200:**
```json
{
  "content": [
    {
      "id": "uuid",
      "entity_type": "FORM",
      "entity_id": "uuid",
      "action": "CONFIRMED",
      "performed_by": {
        "id": "uuid",
        "full_name": "Khalid Salhi"
      },
      "old_value": { "status": "PENDING_CONFIRMATION" },
      "new_value": { "status": "CONFIRMED" },
      "created_at": "2026-01-01T14:30:00Z"
    }
  ]
}
```

---

### GET `/audit/{entityType}/{entityId}`
**Access:** ADMIN, MANAGER

**Response 200:** Paginated list of audit log entries for that specific entity.

---

## HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 202 | Accepted (async operation queued) |
| 400 | Bad request — validation error |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Not found |
| 500 | Internal server error |

---

## Error Response Format

All errors follow this structure:
```json
{
  "timestamp": "2026-01-01T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "form_type is required",
  "path": "/api/v1/forms"
}
```