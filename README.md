# Person Tracker API

Cloudflare Workers API with D1 database for Person Tracker frontend.

## Setup

### 1. Create D1 Database

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create person-tracker-db
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "person-tracker-db"
database_id = "your-actual-database-id"
```

### 2. Create Tables

```bash
# Apply schema to local database (for testing)
npx wrangler d1 execute person-tracker-db --local --file=./schema.sql

# Apply schema to production database
npx wrangler d1 execute person-tracker-db --file=./schema.sql
```

### 3. Deploy Workers

```bash
# Deploy to Cloudflare
npm run deploy
```

## API Endpoints

### Goals
- `GET /api/goals` - List all goals
- `POST /api/goals` - Create goal
- `GET /api/goals/:id` - Get goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal (cascades)

### Milestones
- `GET /api/goals/:id/milestones` - List milestones
- `POST /api/goals/:id/milestones` - Create milestone
- `PUT /api/milestones/:id` - Update milestone
- `DELETE /api/milestones/:id` - Delete milestone

### Daily Logs
- `GET /api/goals/:id/logs` - List daily logs
- `POST /api/goals/:id/logs` - Create daily log
- `DELETE /api/logs/:id` - Delete daily log

### Quotes
- `GET /api/goals/:id/quotes` - List quotes
- `POST /api/goals/:id/quotes` - Create quote
- `DELETE /api/quotes/:id` - Delete quote
