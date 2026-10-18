# 🗳️ Sovereign Democracy — Area-Wise E-Voting and Election Management Platform

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Security](https://img.shields.io/badge/Security-Spring%20Security%20%2B%20JWT%20%2B%20BCrypt-red.svg)](https://spring.io/projects/spring-security)

---

## 📑 Table of Contents
1. [Project Overview & Objective](#-project-overview--objective)
2. [Prototype Notice & Security Disclaimer](#-prototype-notice--security-disclaimer)
3. [Technology Stack](#-technology-stack)
4. [Application Roles & Credentials](#-application-roles--credentials)
5. [3-Layer Architecture Overview](#-3-layer-architecture-overview)
6. [Database Design & Schema](#-database-design--schema)
7. [Environment Variables & MySQL Configuration](#-environment-variables--mysql-configuration)
8. [Installation & Quick Start Guide](#-installation--quick-start-guide)
9. [REST API Documentation](#-rest-api-documentation)
10. [Testing & Acceptance Verification](#-testing--acceptance-verification)
11. [Architecture Decisions & Security Limitations](#-architecture-decisions--security-limitations)

---

## 📖 Project Overview & Objective

**Sovereign Democracy** is an area-wise election management and electronic voting prototype built using Spring Boot 3, Java 21, MySQL, and React with Vite.

The platform provides a structured civic election lifecycle:
1. **Administrator Authority**: An administrator manages election areas, authorized voter records, election lifecycle states, candidates, voting windows, and result publications.
2. **Citizen Access**: Eligible citizens register accounts against authorized electoral roll records using their Election ID and the last 4 digits of their Aadhaar number, set a password, and log in.
3. **Area-Restricted Voting**: Voters can only participate in elections open within their officially assigned area.
4. **Duplicate Prevention**: Strict transactional and relational database constraints prevent duplicate voter records, duplicate user registrations, and duplicate ballots.
5. **Vote Secrecy & Ballot Verification**: Ballots are anonymized and decoupled from voter identity to protect privacy, while voters receive a cryptographic receipt hash to verify inclusion in the certified count.

---

## ⚠️ Prototype Notice & Security Disclaimer

> [!IMPORTANT]
> This project is a demonstration, educational, and development prototype. It is **not** certified, tamper-proof, or suitable for actual legally binding public elections without independent multi-stakeholder cryptographic audits, statutory legal approval, physical custody protections, and verified election infrastructure.

---

## 💻 Technology Stack

### Backend
- **Language**: Java 21 (OpenJDK 21+)
- **Framework**: Spring Boot 3.3.4
- **Security**: Spring Security 6.x, BCrypt password hashing, stateless HMAC-SHA256 JWT
- **Data & ORM**: Spring Data JPA & Hibernate 6.x
- **Database**: MySQL 8.0 with transactional ACID isolation
- **Schema Migrations**: Flyway Database Migrations (`db/migration/V1__init_schema.sql`)
- **Validation**: Jakarta Bean Validation (`jakarta.validation-api`)
- **Build Tool**: Apache Maven with Maven Wrapper (`./mvnw`)
- **Testing**: JUnit 5, Mockito, Spring Security Test, H2 In-Memory DB (test profile)

### Frontend
- **Framework**: React 18 with Vite
- **Language**: JavaScript (ES2022+ / JSX)
- **Styling**: Tailwind CSS 3.4 with custom dark aesthetic
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with JWT Bearer Interceptors
- **State Management**: React Context API
- **Icons**: Lucide React
- **Visuals & Charts**: Recharts

---

## 🔑 Application Roles & Credentials

The system strictly enforces two distinct roles:

### 1. Administrative Account (`ADMIN`)
Only **one** designated administrator account exists in the platform. Public registration of administrators is disabled.
- **Identifier / Username**: `ADMIN-001`
- **Password**: `admin123`
- **Permissions**: Full control over adding/editing areas, adding voter records, CSV bulk import, election state transitions, candidate management, poll closure, result publishing, and audit log inspection.

### 2. Registered Citizen Voter Account (`USER`)
Ordinary citizens who register against existing authorized electoral records.
- **Identifier**: Full Election ID (e.g., `VOT-MUM-1001`, `VOT-MUM-1002`, `VOT-DEL-2001`)
- **Password**: Created by the voter during registration (e.g., `pass123`)
- **Permissions**: View eligible area elections, cast exactly one ballot, inspect results, verify receipt.

### Sample Test Voters Across Initial 10 Demonstration Areas

| City / Area | Constituency | Election ID | Aadhaar Last 4 | Default Password | Citizen Name |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mumbai** | Mumbai South | `VOT-MUM-1001` | `2017` | `pass123` *(Registered)* | Aarav Verma |
| **Mumbai** | Mumbai South | `VOT-MUM-1002` | `2034` | *(Ready to Register)* | Ananya Verma |
| **Mumbai** | Mumbai South | `VOT-MUM-1003` | `2051` | *(Ready to Register)* | Rahul Verma |
| **Delhi** | New Delhi Central | `VOT-DEL-2001` | `3017` | *(Ready to Register)* | Aarav Deshmukh |
| **Bengaluru**| Bengaluru South | `VOT-BLR-3001` | `4017` | *(Ready to Register)* | Aarav Jadhav |
| **Pune** | Pune Metro East | `VOT-PUN-4001` | `5017` | *(Ready to Register)* | Aarav Kulkarni |
| **Hyderabad**| Old City & Cyber | `VOT-HYD-5001` | `6017` | *(Ready to Register)* | Aarav Mehta |
| **Kolkata** | North Heritage | `VOT-KOL-6001` | `7017` | *(Ready to Register)* | Aarav Reddy |
| **Chennai** | Central Urban | `VOT-CHN-7001` | `8017` | *(Ready to Register)* | Aarav Nair |
| **Ahmedabad**| West Industrial | `VOT-AMD-8001` | `9017` | *(Ready to Register)* | Aarav Iyer |
| **Jaipur** | Heritage Ward | `VOT-JAI-9001` | `1017` | *(Ready to Register)* | Aarav Singh |
| **Lucknow** | Central Awadh | `VOT-LKO-10001`| `2017` | *(Ready to Register)* | Aarav Gupta |

*(Total seeded roll: 10 Cities &times; 50 Records = 500 Records)*

---

## 🏛️ 3-Layer Architecture Overview

```
                        ┌─────────────────────────────────────────────────────────┐
                        │              Sovereign Democracy Web UI                 │
                        │       React 18 + Vite + Tailwind CSS + Axios            │
                        └────────────────────────────┬────────────────────────────┘
                                                     │ HTTP REST /api
                                                     ▼
                        ┌─────────────────────────────────────────────────────────┐
                        │             Spring Boot 3.3 REST Backend                │
                        │  Controllers ──► Services ──► Spring Data JPA Repos     │
                        │      ▲                 ▲                 ▲              │
                        │      │                 │                 │              │
                        │  Spring Security   BCrypt Hasher    Flyway Engine       │
                        └────────────────────────────┬────────────────────────────┘
                                                     │ JDBC Port 3306
                                                     ▼
                        ┌─────────────────────────────────────────────────────────┐
                        │                    MySQL 8.0 Server                     │
                        │               Database: sovereign_democracy             │
                        │  10 Normalized Tables • ACID Transactions • Unique Keys │
                        └─────────────────────────────────────────────────────────┘
```

### Layer 1: Authentication, Registration, and Voter Management
- Single root administrator bootstrap (`ADMIN-001`).
- Citizen registration with 2-step verification:
  1. Election ID + Aadhaar Last 4 matched against authorized roll.
  2. Masked demographic confirmation and BCrypt password creation.
- 10 configured metropolitan demonstration areas and 50 synthetic records per area (500 total).
- Duplicate prevention at database level (`UNIQUE` on `voter_id`, `username`, `voter_record_id`).
- Administrative voter directory with search, filter, individual enrollment, and CSV batch import.

### Layer 2: Elections, Candidates, and Voting
- Controlled election lifecycle: `CONFIGURED` &rarr; `UPCOMING` &rarr; `OPEN` &rarr; `CLOSED` &rarr; `TALLYING` &rarr; `RESULT_DECLARED`.
- Area eligibility validation: voters can only vote in their designated jurisdiction.
- Candidate rosters with party names and approved symbols.
- Transactional ballot submission:
  - `VoteParticipation`: Enforces 1-person-1-vote per election via composite unique key `(election_id, voter_record_id)`.
  - `BallotRecord`: Stores candidate selection anonymously in an unlinked pool (Vote Secrecy).
- Cryptographic SHA-256 receipt generation (`VoteReceipt`).

### Layer 3: Election Closure, Results, and Vote Verification
- Admin poll closure: locks ballot intake immediately.
- Result tally calculation: aggregates accepted anonymous ballots by candidate.
- Result declaration: official candidate tally, percentages, and victory margins published.
- Public Ballot Verification:
  - Voters verify receipt status: `Receipt Issued`, `Recorded`, `Counted`, `Verification Pending`, or `Verification Failed`.
  - Zero choice disclosure: verification confirms tally inclusion without exposing the chosen candidate.
- Immutable audit log trail capturing actor, action, target, timestamp, and client IP.

---

## 🗄️ Database Design & Schema

```mermaid
erDiagram
    areas ||--o{ voter_records : "contains"
    areas ||--o{ elections : "hosts"
    voter_records ||--o| user_accounts : "links to"
    elections ||--o{ candidates : "lists"
    elections ||--o{ vote_participations : "tracks turnout"
    voter_records ||--o{ vote_participations : "participates"
    elections ||--o{ ballot_records : "collects"
    candidates ||--o{ ballot_records : "receives"
    elections ||--o{ vote_receipts : "issues"
    elections ||--o{ election_results : "produces"
    candidates ||--o{ election_results : "tallies"

    areas {
        bigint id PK
        varchar area_code UK
        varchar name UK
        varchar constituency_name
        varchar election_type
        boolean is_active
    }

    voter_records {
        bigint id PK
        varchar voter_id UK
        varchar full_name
        varchar father_name
        varchar mother_name
        varchar aadhaar_last4
        bigint area_id FK
        boolean is_eligible
        boolean has_registered_account
    }

    user_accounts {
        bigint id PK
        varchar username UK
        varchar password_hash
        varchar role
        bigint voter_record_id FK,UK
        boolean is_enabled
    }

    elections {
        bigint id PK
        varchar election_code UK
        varchar name
        bigint area_id FK
        timestamp start_time
        timestamp end_time
        varchar status
        timestamp closure_timestamp
    }

    candidates {
        bigint id PK
        varchar candidate_code
        bigint election_id FK
        varchar full_name
        varchar party_name
        varchar party_symbol
    }

    vote_participations {
        bigint id PK
        bigint election_id FK
        bigint voter_record_id FK
        timestamp voted_at
    }

    ballot_records {
        bigint id PK
        bigint election_id FK
        bigint candidate_id FK
        varchar ballot_hash
        timestamp cast_at
    }

    vote_receipts {
        bigint id PK
        varchar receipt_code UK
        bigint election_id FK
        varchar status
        timestamp issued_at
    }

    election_results {
        bigint id PK
        bigint election_id FK
        bigint candidate_id FK
        bigint vote_count
        decimal vote_percentage
        timestamp published_at
    }

    audit_logs {
        bigint id PK
        varchar actor_username
        varchar role
        varchar action
        varchar target
        text details
        varchar ip_address
        timestamp timestamp
    }
```

---

## ⚙️ Environment Variables & MySQL Configuration

Backend configuration in `backend/src/main/resources/application.properties`:

```properties
spring.application.name=sovereign-democracy

# MySQL Datasource Configuration
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/sovereign_democracy}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA & Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# Server Port
server.port=8080

# JWT Token Configuration
jwt.secret=${JWT_SECRET:}
jwt.expiration-ms=86400000

# Flyway Migrations
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
```

To configure variables via shell or environment:
```bash
export DB_URL="jdbc:mysql://localhost:3306/sovereign_democracy"
export DB_USERNAME="root"
export DB_PASSWORD="<YOUR_DB_PASSWORD>"
export JWT_SECRET="<OPTIONAL_256_BIT_HEX_SECRET>"
```

---

## 🚀 Installation & Quick Start Guide

### Prerequisites
- **Java**: OpenJDK 21 or higher (`java -version`)
- **MySQL**: MySQL 8.0 running on `localhost:3306` (`mysqladmin ping -u root`)
- **Node.js**: Node v18+ and npm (`node -v && npm -v`)

### Step 1: Create Database in MySQL
Open MySQL Workbench or terminal client:
```sql
CREATE DATABASE IF NOT EXISTS sovereign_democracy;
USE sovereign_democracy;
```

### Step 2: Start Spring Boot Backend
Navigate to the `backend/` directory and run:
```bash
cd backend
./mvnw clean spring-boot:run
```
- Flyway executes `V1__init_schema.sql` automatically.
- `DataSeeder` bootstraps `ADMIN-001`, 10 areas, and 500 synthetic voter records.
- Backend server runs on `http://localhost:8080`.

### Step 3: Start React Frontend
In a separate terminal, navigate to the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
- Frontend starts at `http://localhost:3000`.
- Vite proxies `/api` calls directly to the Spring Boot backend on `localhost:8080`.

---

## 🌐 REST API Documentation

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Clearance | Body | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | Public | `{ username, password }` | Authenticates voter or administrator, returns JWT token. |
| `POST` | `/api/auth/verify-record` | Public | `{ electionId, aadhaarLast4 }` | Pre-verifies voter against roll and returns masked demographic details. |
| `POST` | `/api/auth/register` | Public | `{ electionId, aadhaarLast4, password }` | Creates user account, hashes password with BCrypt, activates voter. |
| `GET` | `/api/auth/me` | Authenticated | Headers: `Bearer <token>` | Returns authenticated session identity. |

### 2. Areas (`/api/areas`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/areas` | Public | Returns all areas with voter count and registered account tallies. |
| `GET` | `/api/areas/active` | Public | Returns only currently active electoral areas. |
| `GET` | `/api/areas/{id}` | Public | Returns specific area details. |
| `POST` | `/api/areas` | `ADMIN` | Creates new city/area with unique code and name. |
| `PUT` | `/api/areas/{id}` | `ADMIN` | Updates existing area details. |
| `PATCH`| `/api/areas/{id}/toggle-status` | `ADMIN` | Activates or deactivates an area. |

### 3. Voters (`/api/voters`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/voters?areaId=1&search=Aarav` | Public | Paginated list of voters filtered by area and search query. Accessible prior to login. |
| `GET` | `/api/voters/{id}` | Public | Retrieves specific voter demographic record. Accessible prior to login. |
| `POST` | `/api/voters` | `ADMIN` | Adds new single voter record to authorized roll. |
| `POST` | `/api/voters/import-csv` | `ADMIN` | Uploads multipart CSV file to batch-enroll voter records. |
| `DELETE`| `/api/voters/{id}` | `ADMIN` | Deletes voter record from authorized roll with audit logging. |

### 4. Candidates (`/api/candidates` & `/api/elections/{id}/candidates`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/elections/{id}/candidates` | Public | Returns contesting candidates for an election with full names, party, and symbols. |
| `POST` | `/api/elections/{id}/candidates` | `ADMIN` | Adds new contesting candidate (full name, party name, party symbol, bio, image URL). Allowed during active elections prior to result declaration. |
| `PUT` | `/api/candidates/{id}` | `ADMIN` | Edits existing candidate details (name, party, symbol, bio, symbol image). |
| `DELETE`| `/api/candidates/{id}` | `ADMIN` | Removes candidate from election roster before voting commences. |

### 5. Elections & Results (`/api/elections`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/elections` | Public | Lists all active and configured elections with status and candidate counts. |
| `GET` | `/api/elections/{id}` | Public | Retrieves election details. |
| `PATCH`| `/api/elections/{id}/status` | `ADMIN` | Transitions election status (`CONFIGURED` ➔ `OPEN` ➔ `CLOSED`). |
| `POST` | `/api/elections/{id}/declare-results` | `ADMIN` | Tallies anonymized ballots, calculates percentages, certifies winner, and publishes official results. |
| `POST` | `/api/elections/{id}/clear-results` | `ADMIN` | Clears declared results, wipes ballots/participations, and resets election back to `OPEN` for re-testing. |
| `GET` | `/api/elections/{id}/results` | Public | Fetches certified results and candidate vote tallies once officially declared. |

### 6. Voting & Receipt Verification (`/api/voting` & `/api/verification`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `POST` | `/api/voting/cast` | `USER` | Casts ballot in voter's assigned area. Decouples participation from ballot choice and returns cryptographically secure receipt code. |
| `GET` | `/api/voting/my-participations` | `USER` | Lists elections user has voted in (displays only status `Voted`, never candidate choice). |
| `GET` | `/api/verification/receipt/{code}` | Public | Verifies ballot inclusion. If results are still pending, displays `STILL COUNTING — RESULT NOT DECLARED`. If results are declared, displays `COUNTED IN FINAL TALLY` along with official candidate vote counts. |

### 7. Admin Management (`/api/admin`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard-stats` | `ADMIN` | Aggregated telemetry: areas, voters, accounts, elections, statuses. |
| `GET` | `/api/admin/audit-logs` | `ADMIN` | Paginated immutable audit trail logs. |

---

## 🧪 Testing & Acceptance Verification

### Running Automated Backend Tests
Run the comprehensive JUnit 5 and MockMvc acceptance tests:
```bash
cd backend
./mvnw clean test
```

### Full Test Suite Execution Results (14 / 14 Passed)
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.sovereign.democracy.VotingAndVerificationTest
2026-10-18T02:07:01.837+05:30  INFO [main] c.s.d.VotingAndVerificationTest : Started VotingAndVerificationTest in 3.654 seconds
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.178 s -- in com.sovereign.democracy.VotingAndVerificationTest
[INFO] Running com.sovereign.democracy.AdminCandidateAndParticipationTest
2026-10-18T02:07:02.021+05:30  INFO [main] c.s.d.AdminCandidateAndParticipationTest : Started AdminCandidateAndParticipationTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.435 s -- in com.sovereign.democracy.AdminCandidateAndParticipationTest
[INFO] Running com.sovereign.democracy.Layer1AcceptanceTest
2026-10-18T02:07:03.025+05:30  INFO [main] c.s.democracy.Layer1AcceptanceTest : Started Layer1AcceptanceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.433 s -- in com.sovereign.democracy.Layer1AcceptanceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Test Case Coverage Matrix
| Test Class | Test Method | Description | Status |
| :--- | :--- | :--- | :--- |
| **Layer1AcceptanceTest** | `testInitialDataset` | Verifies 10 areas and exactly 50 records per area (500 total) exist in roll. | **PASSED** |
| | `testAdminLogin` | Verifies `ADMIN-001` authenticates and receives valid JWT token with `ROLE_ADMIN`. | **PASSED** |
| | `testPasswordHashing` | Verifies BCrypt hash format (`$2a$`) and absence of plaintext passwords. | **PASSED** |
| | `testUserRegistrationAndLogin` | Tests user registration with Aadhaar last 4, login, and 403 Forbidden check on admin APIs. | **PASSED** |
| | `testDuplicateRegistrationRejection` | Asserts that registering the same voter twice returns `400 Bad Request`. | **PASSED** |
| | `testRegistrationNonExistentVoterFails` | Asserts that un-enrolled Election IDs are rejected. | **PASSED** |
| | `testAdminAddArea` | Asserts that admin can query dashboard metrics and manage area records. | **PASSED** |
| **AdminCandidateAndParticipationTest** | `testCandidateManagement` | Verifies admin can add new candidates and edit candidate details (name, party, symbol). | **PASSED** |
| | `testMissingCandidateValidationAndRosterLocking` | Validates that elections cannot open without candidates and locks roster once results are declared. | **PASSED** |
| | `testVoterParticipationAndPrivacyProtection` | Asserts voter participation displays `Voted` or `Not Voted` without leaking candidate choices. | **PASSED** |
| | `testResultsCalculationAndDeclaration` | Verifies closing election, tallying anonymized ballots, percentage calculation, and winner declaration. | **PASSED** |
| | `testClearResultsAndResetPolls` | Asserts that clearing results wipes ballots, resets participations, and reopens election to `OPEN`. | **PASSED** |
| | `testAdminRoleAccessControl` | Asserts unauthorized users are forbidden (HTTP 403) from administrative endpoints. | **PASSED** |
| **VotingAndVerificationTest** | `testBallotCastingAndVerification` | Full end-to-end voting test: single ballot restriction, decoupled storage, and receipt verification. | **PASSED** |

### Building Frontend
```bash
cd frontend
npm run build
```
- Production bundle compiled with 0 errors via Vite.

---

## 🔒 Architecture Decisions & Security Limitations

### 1. Vote Secrecy Design
- The system achieves ballot confidentiality by **splitting participation from choice**:
  - `VoteParticipation` stores `(election_id, voter_record_id, voted_at)` with a unique constraint to prevent double-voting.
  - `BallotRecord` stores `(election_id, candidate_id, ballot_hash, cast_at)` without any foreign key to `voter_records` or `user_accounts`.
- *Limitation*: In a small election with few voters, correlation by timestamp could theoretically be attempted if database transactions are inspected at the microsecond level. In a production statutory election, homomorphic encryption, shuffle-nets, or zero-knowledge verifiable mixing must be used.

### 2. Aadhaar Last 4 Digits
- The prototype verifies only the **last 4 digits** of the Aadhaar number as a demonstration credential.
- *Limitation*: The last 4 digits are not a substitute for cryptographically certified biometric or PKI-based national identity verification in a sovereign general election.

### 3. Single Administrator Authority
- For prototype management, one central administrator oversees area and candidate configuration.
- *Limitation*: A single administrative account creates a concentration of authority. Real-world statutory elections require separation of duties across multiple independent commissioners using multi-party threshold cryptography ($k$-of-$n$ key sharing).

---

## 📄 License
This project is licensed under the MIT License for educational and prototyping purposes.
