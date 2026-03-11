# Job Application State Machine (NestJS)

Technical challenge implementation for Senior Full Stack Engineer role.

## Features
- **State Machine**: Managed transitions (Applied → Interviewing → Contracted → Completed).
- **Audit Logging**: Full history of status changes with database transactions.
- **Security**: Role-based access control (ADMIN, COMPANY) for key transitions.
- **Notifications**: Automatic email sending via Resend on contract issuance.
- **CI/CD**: GitHub Actions for automated linting, testing, and building.

## Tech Stack
- **Backend**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Email**: Resend
- **Test**: Jest

## Setup & Run

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### 2. Environment Configuration
Copy `.env.example` to `.env` and update the variables:
```bash
cp .env.example .env
```

### 3. Start PostgreSQL Database
```bash
docker-compose up -d
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Database Setup
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 6. Start Application
```bash
npm run start:dev
```

## API Endpoints

### Update Status
`PATCH /api/applications/:id/status`
- **Body**:
```json
{
    "status": "INTERVIEWING",
    "changedByEmail": "admin@example.com",
    "metadata": "Interview scheduled for Monday"
}
```

### Get History
`GET /api/applications/:id/history`

## Testing
```bash
npm run test
```
