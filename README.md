# Bank Licensing & Compliance Portal

A licensing portal for the National Bank of Rwanda (BNR). Banks, microfinance institutions, insurance companies, and individuals apply for the licenses they need, and BNR staff review and decide. It's two NestJS services behind a React frontend, all wired up with Kafka, Redis, MySQL, and MinIO.

If you want to know why it's built this way, have a look at [DESIGN.md](DESIGN.md).

## What it does

Licensing at a central bank usually means a lot of paperwork, a lot of back and forth, and a lot of waiting. This portal tries to fix that. Applicants fill in what they need online, upload their documents, and track where things stand. Reviewers and approvers at BNR pick up applications from a queue, work through them, and move them along.

## What's inside

- Email and password login, with a 6-digit OTP sent to your inbox every time you sign in
- Different roles for admins, reviewers, approvers, organizations applying for licenses, and individuals
- A configurable catalog of license types, each with its own list of required documents
- A clear state machine: an application is submitted, then reviewed, then approved or rejected
- Emails sent asynchronously through Kafka, so the API doesn't sit around waiting for SMTP
- Uploaded documents stored in MinIO
- Lookup endpoints cached in Redis for 5 minutes
- Full Swagger documentation, ready to poke at

## How it's laid out

```
.
├── licensing-service/          NestJS API, port 3001
├── mailing-sender-service/     Kafka consumer + Bull mailer, port 3002
├── frontend/                   React + Vite + Tailwind, port 5173
├── docker-compose.yml          everything wired together
├── docs/
│   ├── architecture.gif
│   └── state-machine.png
├── DESIGN.md
└── README.md
```

## Running it

You only need Docker Desktop. Everything else lives in containers.

```
docker compose up -d
```

The first boot takes a couple of minutes. MySQL has to initialize, Kafka comes up, and the two Nest services need to compile. Once everything is live, here's where to find things:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Licensing API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |
| MailHog (catches outgoing email) | http://localhost:8025 |
| MinIO console | http://localhost:9090 (minioadmin / minioadmin) |
| Kafdrop | http://localhost:9000 |

> Note: While testing login or password reset, open `http://localhost:8025` in another tab to view the OTP emails sent by the system. Use the OTP from MailHog to complete authentication.

The first time the licensing service starts, it seeds the database with departments, institution types, license types, and a handful of test accounts you can use right away.

When you're done:

```
docker compose down
```

Add `-v` if you also want to wipe the MySQL, Redis, and MinIO volumes.

## Test accounts

Sign in with any of these. After you submit your password, the app emails a 6-digit OTP that you'll find waiting in [MailHog](http://localhost:8025).

| Role | Email | Password |
|---|---|---|
| Admin | admin@bnr.rw | Admin@1234 |
| Reviewer (Banking) | reviewer.banking@bnr.rw | Reviewer@1234 |
| Approver (Banking) | approver.banking@bnr.rw | Approver@1234 |
| Reviewer (Insurance) | reviewer.insurance@bnr.rw | Reviewer@1234 |
| Approver (Insurance) | approver.insurance@bnr.rw | Approver@1234 |
| Organization applicant | bank1@example.rw | Bank1@1234 |
| Individual applicant | jean@example.rw | Jean@1234 |

You can also just register your own applicant account through the UI.

## Working on it

The compose stack is great when you just want to run the whole thing. When you're actually writing code, it's usually easier to run one service locally with hot reload and let the rest stay in containers.

For example, if you're working on the licensing service:

```
docker compose up -d mysql redis kafka zookeeper minio minio-init mailhog mailing-sender-service
cd licensing-service
cp .env.example .env
npm install
npm run start:dev
```

Same idea for the mailer or the frontend. Bring up everything you're not touching, then run the one you are.

### Inside each service

For the two NestJS services:

```
npm run build       builds it
npm run start:dev   runs it with hot reload
npm test            runs jest (licensing-service)
npm run lint        eslint, fixes what it can
```

For the frontend:

```
npm run dev         vite dev server with hot reload
npm run build       builds into dist/
```

## When things go wrong

**Port 3306 is already in use.** You probably have MySQL already running on your machine. You can either stop it, or drop a `docker-compose.override.yml` next to the main compose file to use a different host port:

```yaml
services:
  mysql:
    ports: !override
      - "3307:3306"
```

That override file is gitignored, so it only affects your machine. Inside the compose network, the licensing service always talks to MySQL at `mysql:3306` no matter what host port you pick.

**The OTP email never shows up.** First check [MailHog](http://localhost:8025). If nothing's there, the licensing service probably couldn't reach Kafka, or the mailing service is down. `docker compose logs mailing-sender-service` usually tells you what's going on.

**You edited a license type and the change isn't showing.** Lookup endpoints are cached in Redis for 5 minutes. The cache gets cleared automatically when you edit through the API, but if you changed the database directly, you'll need to flush it yourself:

```
docker compose exec redis redis-cli FLUSHALL
```