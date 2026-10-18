# 🗳️ Sovereign Democracy — Area-Wise E-Voting and Election Management Platform

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Security](https://img.shields.io/badge/Security-Spring%20Security
%20%2B%20JWT%20%2B%20BCrypt-red.svg)](https://spring.io/projects/spring-security)

---

## 📑 Table of Contents
1. [Project Overview & Objective](#-project-overview--objective)
2. [Prototype Notice & Security Disclaimer](#-prototype-notice--security-disclaimer)
3. [Technology Stack](#-technology-stack)
4. [Application Roles & Credentials](#-application-roles--credentials)
5. [End-to-End System Architecture](#-end-to-end-system-architecture)
6. [Database Design & Schema](#-database-design--schema)
7. [Environment Variables & Configuration](#-environment-variables--configuration)
8. [Installation & Execution Guide](#-installation--execution-guide)
9. [REST API Documentation](#-rest-api-documentation)
10. [Testing & Acceptance Verification](#-testing--acceptance-verification)
11. [Enterprise Features & Performance Optimizations](#-enterprise-features--performance-optimizations)
12. [Secure Password Recovery, Firebase Security Auditing & Identity Conventions](#-feature-secure-password-recovery-firebase-security-auditing--identity-conventions)
13. [Architecture Decisions & Security Limitations](#-architecture-decisions--security-limitations)

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
- **Default Password**: `admin123`
- **Recovery Email**: `akhilv.verma07@gmail.com`
- **Permissions**: Full control over adding/editing areas, adding voter records, CSV bulk import, election state transitions, candidate management, poll closure, result publishing, AI civic analytics, anomaly detection reviews, and audit log inspection.

### 2. Registered Citizen Voter Account (`USER`)
Ordinary citizens who register against existing authorized electoral records.
- **Identifier**: Full Election ID (e.g., `VOT-MUM-1001`, `VOT-MUM-1002`, `VOT-DEL-2001`)
- **Default Password**: Set on-demand during registration (default for active demo account `VOT-MUM-1001`: `pass123`)
- **Recovery Email Convention**: `nameaadharnumber@gmail.com`
  - Formula: `LOWERCASE(FULL_NAME without spaces) + AADHAAR_NUMBER + "@gmail.com"` (no spaces, no plus sign)
  - *Example*: Citizen **Aarav Verma** with Aadhaar `2017` &rarr; `aaravverma2017@gmail.com`
  - *Example*: Citizen **Ananya Deshmukh** with Aadhaar `2034` &rarr; `ananyadeshmukh2034@gmail.com`
  - *Example*: Citizen **Rahul Jadhav** with Aadhaar `2051` &rarr; `rahuljadhav2051@gmail.com`
- **Zero-PII Public Privacy**: Regular users never see Aadhaar numbers. The roster column displays `Protected • Zero PII` & `Official Roll Verified`. Only administrators have authorization to view Aadhaar records.
- **Authenticated Dossier**: Upon authenticated login, the Voter Dashboard prominently features the verified electoral roll card containing the citizen's **Voter Name**, **Father's Name**, **Mother's Name**, **Assigned Recovery Email**, and **Constituency**.
- **Permissions**: View eligible area elections, cast exactly one ballot, inspect published results, verify cryptographic receipts.

### Sample Test Voters Across Initial 10 Demonstration Areas

| City / Area | Constituency | Election ID | Aadhaar Last 4 | Recovery Email | Citizen Name | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mumbai** | Mumbai South | `VOT-MUM-1001` | `2017` | `aaravverma2017@gmail.com` | Aarav Verma | Active Demo Account (`pass123`) |
| **Mumbai** | Mumbai South | `VOT-MUM-1002` | `2034` | `ananyadeshmukh2034@gmail.com` | Ananya Deshmukh | Ready to Sign Up (Verify: `2034`) |
| **Mumbai** | Mumbai South | `VOT-MUM-1003` | `2051` | `rahuljadhav2051@gmail.com` | Rahul Jadhav | Ready to Sign Up (Verify: `2051`) |
| **Delhi** | New Delhi Central | `VOT-DEL-2001` | `3017` | `aaravdeshmukh3017@gmail.com` | Aarav Deshmukh | Ready to Sign Up (Verify: `3017`) |
| **Bengaluru**| Bengaluru South | `VOT-BLR-3001` | `4017` | `aaravjadhav4017@gmail.com` | Aarav Jadhav | Ready to Sign Up (Verify: `4017`) |
| **Pune** | Pune Metro East | `VOT-PUN-4001` | `5017` | `aaravkulkarni5017@gmail.com` | Aarav Kulkarni | Ready to Sign Up (Verify: `5017`) |
| **Hyderabad**| Old City & Cyber | `VOT-HYD-5001` | `6017` | `aaravmehta6017@gmail.com` | Aarav Mehta | Ready to Sign Up (Verify: `6017`) |
| **Kolkata** | North Heritage | `VOT-KOL-6001` | `7017` | `aaravreddy7017@gmail.com` | Aarav Reddy | Ready to Sign Up (Verify: `7017`) |
| **Chennai** | Central Urban | `VOT-CHN-7001` | `8017` | `aaravnair8017@gmail.com` | Aarav Nair | Ready to Sign Up (Verify: `8017`) |
| **Ahmedabad**| West Industrial | `VOT-AMD-8001` | `9017` | `aaraviyer9017@gmail.com` | Aarav Iyer | Ready to Sign Up (Verify: `9017`) |
| **Jaipur** | Heritage Ward | `VOT-JAI-9001` | `1017` | `aaravsingh1017@gmail.com` | Aarav Singh | Ready to Sign Up (Verify: `1017`) |
| **Lucknow** | Central Awadh | `VOT-LKO-10001`| `2017` | `aaravgupta2017@gmail.com` | Aarav Gupta | Ready to Sign Up (Verify: `2017`) |

*(Total seeded roll: 10 Cities &times; 50 Records = 500 Records. Exactly 1 demonstration account in Mumbai (`VOT-MUM-1001`) is active; all other 499 citizens can register by verifying their 4-digit Aadhaar number and creating their password).*

---

## 🏛️ End-to-End System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client / Presentation Layer (React 18 + Vite + Tailwind CSS)"]
        UI_Citizen["Citizen Portal\n- Voter Registration & Login\n- Secret Key Request\n- Anonymized Ballot Submission\n- Cryptographic Receipt Verification\n- Public AI Election Insights"]
        UI_Admin["Administrator Command Center\n- Area & Voter Management\n- Candidate PDF Import (PDFBox)\n- Election State Transitions\n- AI Civic Intelligence Dashboard\n- Isolation Forest Anomaly Review\n- Firebase Audit Outbox Monitor"]
    end

    subgraph SecurityGateway ["Security & Ingress Layer (Spring Security 6.x)"]
        Filter_JWT["JwtAuthenticationFilter\n- Stateless HMAC-SHA256 Validation\n- Instant Invalidation via password_changed_at"]
        Filter_IP["ClientIpResolver\n- Dynamic Client IP Extraction\n- X-Forwarded-For / X-Real-IP / RemoteAddr"]
        Encoder_BCrypt["BCryptPasswordEncoder (Strength 10)"]
    end

    subgraph ServiceLayer ["Core Application Engine (Spring Boot 3.3.4 & Java 21)"]
        Svc_Auth["AuthService & PasswordResetService\n- Single-Use 256-bit Secure Tokens\n- Timing-Safe Hash Verification\n- Recovery Email Notification"]
        Svc_Voter["VoterService & AreaService\n- 500-Voter Multi-Area Directory\n- Computed Email: name+aadhaar@gmail.com"]
        Svc_Voting["VotingService & SecretVotingKeyService\n- High Entropy SVK Generation\n- Salted SHA-256 Verifier Storage\n- Atomic Ballot Row Locking & Anonymization"]
        Svc_Chain["BlockchainService (Web3j)\n- In-Memory Bytecode Contract Deployment\n- SHA-256 Nullifier On-Chain Logging\n- Certified Tally Commitment Publishing"]
        Svc_AI["AiElectionInsightsService\n- Multi-Area Turnout & Velocity Analytics\n- Grounded Civic Chatbot\n- Unstructured Candidate PDF Parser"]
        Svc_Anomaly["IsolationForestService\n- Native Pure-Java Anomaly Detection (100 Trees)\n- 7-Dimensional Operational Telemetry\n- Automated Anomaly Severity & Remediation"]
        Svc_FB["FirebaseAuditService\n- Zero-Drop Outbox Dispatcher\n- Direct Google REST API Client\n- Idempotent Event Delivery & Outbox Retry"]
    end

    subgraph StorageLayer ["Relational Datastore (MySQL 8.0 - ACID)"]
        DB_Core[("MySQL Relational Schema\n- user_accounts (Recovery Emails)\n- voter_records (Electoral Roll)\n- areas, elections, candidates\n- vote_participations (1-Person-1-Vote)\n- ballot_records (Decoupled Choice)\n- vote_receipts & election_results\n- audit_logs (Dynamic Client IPs)\n- anomaly_alerts (ML Diagnostics)\n- password_reset_tokens (SHA-256 Hashed)\n- firebase_audit_outbox (Outbox Queue)")]
    end

    subgraph ExternalServices ["External Decentralized & Cloud Infrastructure"]
        Node_Chain["EVM Blockchain Ledger (Hyperledger Besu / Hardhat)\n- SovereignDemocracyVoting.sol\n- Immutable Nullifier Registry\n- Dual On-Chain Receipt Verification\n- RPC Genesis Reset to Block #0"]
        Cloud_Gemini["Google Gemini AI Platform\n- gemini-3.8-flash / gemini-1.5-flash\n- Civic Intelligence & Trend Summaries"]
        Cloud_Firestore["Firebase Cloud Firestore\n- security_audit_logs Collection\n- Zero-Trust Client Rules (Backend Only)\n- Outbox Delivery & Audit Mirroring"]
    end

    UI_Citizen -->|HTTPS REST| Filter_JWT
    UI_Admin -->|HTTPS REST| Filter_JWT
    Filter_JWT --> Filter_IP
    Filter_IP --> ServiceLayer

    Svc_Auth --> DB_Core
    Svc_Voter --> DB_Core
    Svc_Voting --> DB_Core
    Svc_Voting --> Svc_Chain
    Svc_Chain --> Node_Chain
    Svc_Chain --> DB_Core
    Svc_AI --> Cloud_Gemini
    Svc_Anomaly --> DB_Core
    Svc_FB --> DB_Core
    Svc_FB --> Cloud_Firestore
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

## ⚙️ Environment Variables & Configuration

### 1. Spring Boot & Database Configuration (`backend/src/main/resources/application.properties` and `.env.example`)

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
jwt.secret=${JWT_SECRET:c4a8b792348f987d6e5a43210bcedf8745612309874561230987456123098745}
jwt.expiration-ms=86400000

# Blockchain (Hyperledger Besu / Ethereum-compatible dev node)
blockchain.enabled=${BLOCKCHAIN_ENABLED:false}
blockchain.rpc-url=${BLOCKCHAIN_RPC_URL:http://localhost:8545}
blockchain.chain-id=${BLOCKCHAIN_CHAIN_ID:1337}
blockchain.contract-address=${BLOCKCHAIN_CONTRACT_ADDRESS:0x5FbDB2315678afecb367f032d93F642f64180aa3}
blockchain.signer-private-key=${BLOCKCHAIN_SIGNER_PRIVATE_KEY:0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}

# Google Gemini AI Configuration
gemini.api-key=${GEMINI_API_KEY:}
gemini.model=${GEMINI_MODEL:gemini-3.8-flash}
gemini.enabled=${GEMINI_ENABLED:true}
gemini.timeout-seconds=15
gemini.rate-limit-per-minute=30

# Flyway Migrations
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
spring.flyway.locations=classpath:db/migration
```

### 2. Firebase Configuration (`.env` and `src/lib/firebase.ts`)

```properties
FIREBASE_API_KEY=AIzaSyCJGa3s2WAM6q3Gndw1-KPEQc4ZhoP_vZg
FIREBASE_AUTH_DOMAIN=evotingsystem-4c3a1.firebaseapp.com
FIREBASE_DATABASE_URL=https://evotingsystem-4c3a1-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=evotingsystem-4c3a1
FIREBASE_STORAGE_BUCKET=evotingsystem-4c3a1.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=746291117510
FIREBASE_APP_ID=1:746291117510:web:9ecbb9d4d7d4f504d986c7
FIREBASE_MEASUREMENT_ID=G-QBR78BHWZY
```

---

## 🚀 Installation & Execution Guide

### Prerequisites
- **Java**: OpenJDK 21 or higher (`java -version`)
- **MySQL**: MySQL 8.0 running on `localhost:3306` (`mysqladmin ping -u root`)
- **Node.js**: Node v18+ and npm (`node -v && npm -v`)

---

### Option 1: Run Sovereign Democracy Platform (Spring Boot + React + Besu Devnet)

#### Step 1: Start Blockchain Devnet & Deploy Smart Contract (Optional / Feature 2)
```bash
cd blockchain
npm install

# Start local Besu node via Docker Compose
docker compose -f docker-compose.besu.yml up -d

# Compile and deploy SovereignDemocracyVoting.sol
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

#### Step 2: Start Spring Boot Backend
In the `backend/` directory:
```bash
cd backend
./mvnw clean spring-boot:run
```
- Flyway automatically applies migrations `V1`, `V2`, `V3__secret_voting_keys.sql`, and `V4__blockchain_and_receipt_enhancements.sql`.
- `DataSeeder` seeds `ADMIN-001`, 10 areas, and 500 test voter records.
- Backend runs at `http://localhost:8080`.

#### Step 3: Start React 18 Frontend
In the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
- Frontend starts at `http://localhost:5173` (or `http://localhost:3000`).
- Proxies `/api` calls directly to the Spring Boot backend on `localhost:8080`.

#### Step 4: Run Automated Tests
```bash
# Run all 33 Spring Boot unit and integration tests:
cd backend
./mvnw test

# Run all 7 Hardhat smart contract tests:
cd ../blockchain
npm test

# Build frontend production bundle:
cd ../frontend
npm run build
```

---

### Option 2: Run Full-Stack Node.js / Express Server (with Firebase Adapters)

If running the Node.js Express + Vite server with Firebase / Firestore database adapters:
```bash
# In the root directory:
npm install
npm run dev
```
- Starts `tsx server.ts` at `http://localhost:3000`.
- Connects to Firebase project `evotingsystem-4c3a1`.
- Compiles via `npm run build` and type-checks via `npm run lint`.

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
| `GET` | `/api/voters?areaId=1&search=Aarav&page=0&size=500` | Public | Paginated list of voters filtered by area ID and real-time search query (supports up to 500 voters per view). Accessible prior to login. |
| `GET` | `/api/voters/{id}` | Public | Retrieves specific voter demographic record. Accessible prior to login. |
| `POST` | `/api/voters` | `ADMIN` | Adds new single voter record to authorized roll. |
| `POST` | `/api/voters/import-csv` | `ADMIN` | Uploads multipart CSV file to batch-enroll voter records. |
| `DELETE`| `/api/voters/{id}` | `ADMIN` | Deletes voter record from authorized roll with audit logging. |

### 4. Candidates (`/api/candidates` & `/api/elections/{id}/candidates`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/elections/{id}/candidates` | Public | Returns contesting candidates for an election with full names, party, and symbols. |
| `POST` | `/api/elections/{id}/candidates` | `ADMIN` | Adds new contesting candidate (full name, party name, party symbol, bio, image URL). |
| `PUT` | `/api/candidates/{id}` | `ADMIN` | Edits existing candidate details (name, party, symbol, bio, symbol image). |
| `DELETE`| `/api/candidates/{id}` | `ADMIN` | Removes candidate from election roster before voting commences. |
| `POST` | `/api/candidates/import-pdf/preview` | `ADMIN` | Uploads nomination PDF, extracts structured candidate data via Apache PDFBox, and returns preview. |
| `POST` | `/api/candidates/import-pdf/confirm` | `ADMIN` | Confirms and atomically saves candidate records into election roster. |

### 5. Elections, Results & Participation (`/api/elections`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/elections` | Public | Lists all active and configured elections with status and candidate counts. |
| `GET` | `/api/elections/{id}` | Public | Retrieves election details. |
| `PATCH`| `/api/elections/{id}/status` | `ADMIN` | Transitions election status (`CONFIGURED` ➔ `OPEN` ➔ `CLOSED`). |
| `POST` | `/api/elections/{id}/declare-results` | `ADMIN` | Tallies anonymized ballots, certifies winner, publishes official results, and anchors tally commitment on-chain (< 40ms direct Web3j). |
| `POST` | `/api/elections/{id}/clear-results` | `ADMIN` | Clears declared results, wipes ballots/participations, and resets election back to `OPEN` for re-testing. |
| `GET` | `/api/elections/{id}/results` | Public | Fetches certified results and candidate vote tallies once officially declared. |
| `GET` | `/api/elections/{id}/voter-participation` | `ADMIN` | Fetches voter turnout and voting status for a specific election and its jurisdiction. |
| `GET` | `/api/elections/all/voter-participation` | `ADMIN` | Consolidated nationwide turnout: displays all 500 voters across all areas with live status (`Voted` / `Not Voted`), timestamp, and area filter. |

### 6. Secret Voting Key & Voting (`/api/voting`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `POST` | `/api/voting/keys/generate/{electionId}` | `USER` | Generates high-entropy `SVK-XXXX-XXXX-XXXX-XXXX` and returns raw key once while storing salted SHA-256 verifier. |
| `GET` | `/api/voting/keys/status/{electionId}` | `USER` | Returns current key status (`ISSUED`, `USED`, `REVOKED`) and prefix. |
| `POST` | `/api/voting/cast-ballot` | `USER` | Validates Secret Voting Key, verifies area eligibility, marks key `USED`, records participation, and broadcasts nullifier & commitment on blockchain. |
| `GET` | `/api/voting/my-participations` | `USER` | Lists elections user has voted in (displays only status `Voted`, never candidate choice). |
| `GET` | `/api/voting/verify-receipt/{receiptHash}` | Public | Dual-layer receipt verification: audits ballot against MySQL and verifies on-chain event logs and finality. |

### 7. Blockchain Telemetry & Ledger Management (`/api/blockchain`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/blockchain/health` | Public | Returns node connectivity, chain ID, block height, and smart contract address. |
| `POST` | `/api/blockchain/reconcile` | `ADMIN` | Scans for pending blockchain transactions and updates confirmation statuses. |
| `POST` | `/api/blockchain/reset` | `ADMIN` | Triggers EVM `hardhat_reset` JSON-RPC to revert blockchain to Genesis Block #0, wipes pending/confirmed tx logs, and unbinds contract address. |

### 8. Admin Management (`/api/admin`)
| Method | Endpoint | Clearance | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard-stats` | `ADMIN` | Aggregated telemetry: areas, voters, accounts, total elections, and `publishedElections` (Declared Tallies count). |
| `GET` | `/api/admin/audit-logs` | `ADMIN` | Paginated immutable audit trail logs. |

### 9. Google Gemini AI Election Insights & Voter Assistant (`/api/ai`)
| Method | Endpoint | Clearance | Body | Description |
|---|---|---|---|---|
| `GET` | `/api/ai/elections/{id}/public-insights` | Public | None | Publicly accessible turnout %, general participation velocity, participation trend, and neutral civic turnout summary. No PII or candidate votes. |
| `GET` | `/api/ai/elections/{id}/insights` | `ADMIN` | None | Operational dashboard metrics: area turnout, 15-minute sliding window velocity & change %, participation tier classification, and Gemini AI synthesis. |
| `GET` | `/api/ai/anomalies/elections/{electionId}` | `ADMIN` | None | Evaluates live operational telemetry using Isolation Forest (7 dimensions), returning score, severity, metric contributions, and Gemini advice. |
| `GET` | `/api/ai/anomalies` | `ADMIN` | Query: `status`, `page`, `size` | Paginated audit log of detected operational anomalies stored via Flyway V5. |
| `PATCH`| `/api/ai/anomalies/{alertId}/review` | `ADMIN` | `{ reviewStatus, adminNotes }` | Updates anomaly review workflow (`REVIEWED`, `CONFIRMED_INCIDENT`, `DISMISSED`) with admin notes. |
| `POST` | `/api/ai/assistant/chat` | Public | `{ message }` | Grounded civic voter assistant answering questions about registration, SVK workflow, eligibility, and receipts with strict prompt-injection defenses. |
| `POST` | `/api/ai/candidates/pdf-assistance` | `ADMIN` | `{ electionId, rawText }` | Recovers and structures candidate rosters from unstructured PDF text using Gemini AI fallback. |
| `POST` | `/api/ai/elections/{id}/report` | `ADMIN` | None | Post-election executive audit report summarizing declared results, blockchain verification, turnout metrics, and audit logs. |

---

## 🧪 Testing & Acceptance Verification

### Running Automated Backend Tests
Run the comprehensive JUnit 5 and MockMvc acceptance tests:
```bash
cd backend
./mvnw clean test
```

### Full Test Suite Execution Results (52 / 52 Passed)
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.sovereign.democracy.PdfCandidateImportTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.887 s -- in com.sovereign.democracy.PdfCandidateImportTest
[INFO] Running com.sovereign.democracy.BlockchainIntegrationTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.589 s -- in com.sovereign.democracy.BlockchainIntegrationTest
[INFO] Running com.sovereign.democracy.SecretVotingKeyTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.689 s -- in com.sovereign.democracy.SecretVotingKeyTest
[INFO] Running com.sovereign.democracy.AdminCandidateAndParticipationTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.435 s -- in com.sovereign.democracy.AdminCandidateAndParticipationTest
[INFO] Running com.sovereign.democracy.VotingAndVerificationTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.178 s -- in com.sovereign.democracy.VotingAndVerificationTest
[INFO] Running com.sovereign.democracy.AiElectionInsightsTest
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.506 s -- in com.sovereign.democracy.AiElectionInsightsTest
[INFO] Running com.sovereign.democracy.AnomalyDetectionTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 5.207 s -- in com.sovereign.democracy.AnomalyDetectionTest
[INFO] Running com.sovereign.democracy.ClientIpLoggingTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 4.700 s -- in com.sovereign.democracy.ClientIpLoggingTest
[INFO] Running com.sovereign.democracy.Layer1AcceptanceTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.443 s -- in com.sovereign.democracy.Layer1AcceptanceTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 57, Failures: 0, Errors: 0, Skipped: 0
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
| **SecretVotingKeyTest** | `testKeyGenerationAndVerifierStorage` | High-entropy `SVK-XXXX-XXXX-XXXX-XXXX` generation, salted SHA-256 verifier storage, single reveal. | **PASSED** |
| | `testValidateAndConsumeKeySuccess` | Validates key consumption on vote submission and marks status to `USED`. | **PASSED** |
| | `testDuplicateKeyUseFails` | Asserts repeated consumption attempts return `400 Bad Request`. | **PASSED** |
| | `testBruteForceProtectionLockout` | Locks key after 5 consecutive failed verification attempts. | **PASSED** |
| | `testKeyReissuanceInvalidatesPrevious` | Revokes older key upon reissue request and generates fresh high-entropy key. | **PASSED** |
| | `testCrossElectionKeyUseRejected` | Prevents keys issued for Election A from being consumed in Election B. | **PASSED** |
| **BlockchainIntegrationTest** | `testHealthEndpointGracefulOffline` | Validates blockchain health API reports node status and gracefully handles offline RPC. | **PASSED** |
| | `testRecordBallotCommitmentOfflineFallback` | Asserts vote acceptance completes successfully with `PENDING_BROADCAST` when blockchain node is offline. | **PASSED** |
| | `testReceiptBlockchainVerificationModel` | Confirms receipt DTO encapsulates blockchain audit properties and status. | **PASSED** |
| | `testTallyCommitmentPublishOfflineGraceful` | Confirms tally commitment publication executes gracefully without breaking result declaration. | **PASSED** |
| | `testReconciliationEndpoint` | Validates admin trigger for pending blockchain transaction reconciliation. | **PASSED** |
| **PdfCandidateImportTest** | `testPdfPreviewSuccess` | Parses structured PDF candidate tables into extraction preview using Apache PDFBox. | **PASSED** |
| | `testPdfPreviewDuplicateDetection` | Flags duplicate candidates against database and within same PDF file. | **PASSED** |
| | `testPdfPreviewRejectsMalformedFiles` | Rejects empty, corrupted, or non-PDF files with clear error feedback. | **PASSED** |
| | `testPdfPreviewUnauthorized` | Rejects non-admin candidate import attempts with `403 Forbidden`. | **PASSED** |
| | `testPdfConfirmImportSuccess` | Atomically persists confirmed candidates into election roster within database transaction. | **PASSED** |
| **AnomalyDetectionTest** | `testIsolationForestNormalScoring` | Asserts standard telemetry produces normal score < 0.60 and no warning. | **PASSED** |
| | `testSyntheticAnomalyDetectionAllScenarios` | Verifies detection of vote flooding, credential stuffing, duplicate storms, and blockchain stalls. | **PASSED** |
| | `testExtremeAnomalyScoring` | Asserts extreme telemetry triggers `CRITICAL` severity and score > 0.75. | **PASSED** |
| | `testModelScoringReproducibility` | Asserts pure Java Isolation Forest scoring is strictly reproducible with seeded PRNG. | **PASSED** |
| | `testAdminEndpointSecurity` | Asserts unauthenticated and non-admin requests are rejected with `403 Forbidden`. | **PASSED** |
| | `testAdminAnomalyEvaluationLive` | Verifies live evaluation endpoint calculates 7 metrics, contributions, and Gemini advice. | **PASSED** |
| | `testAnomalyReviewLifecycle` | Verifies admin review state transition (`PENDING_REVIEW` ➔ `REVIEWED` / `CONFIRMED`) and persistence. | **PASSED** |
| | `testPrivacyGuarantees` | Asserts zero voter PII, names, secret keys, or Aadhaar details exist in evaluation output. | **PASSED** |
| **ClientIpLoggingTest** | `testLoopbackIdentification` | Verifies loopback detection identifies all local addresses (IPv4 & IPv6). | **PASSED** |
| | `testLoopbackResolvesToHostIp` | Verifies loopback requests resolve to host system IP `10.195.254.116`. | **PASSED** |
| | `testRemoteIpPreserved` | Verifies remote system IP is preserved for external network clients. | **PASSED** |
| | `testAuditLogRecordsHostIpForLocalLogin` | Verifies local admin login produces audit record with `10.195.254.116`. | **PASSED** |
| | `testAuditLogRecordsRemoteIpForExternalDevice` | Verifies external device login produces audit record with their actual remote IP. | **PASSED** |
| **SovereignDemocracyVoting (Hardhat)** | 7 Smart Contract Tests | Tests deployer authority, election lifecycle, nullifiers, commitments, and tally commitments. | **7 PASSED** |

### Building Frontend
```bash
cd frontend
npm run build
```
- Production bundle compiled with 0 errors via Vite.

---

## 🚀 Enterprise Features & Performance Optimizations

### 1. Secret Voting Key (SVK)
- **High Entropy**: Cryptographically secure 128-bit key formatted as `SVK-XXXX-XXXX-XXXX-XXXX` generated via Java `SecureRandom`.
- **Verifier Storage**: Raw keys are never stored in the database. Only an election-scoped, salted SHA-256 hash verifier (`key_hash` + `salt`) is persisted.
- **Single-Use Enforcement**: Keys are atomically consumed during ballot casting with strict row-locking (`UPDATE ... WHERE status = 'ISSUED'`).
- **Brute-Force Lockout**: Failed verification attempts are tracked independently (`Propagation.REQUIRES_NEW`). After 5 consecutive failures, the key status transitions to `REVOKED` / locked.
- **Reissuance Workflow**: Voters can request key reissuance prior to voting; existing keys are automatically invalidated (`REVOKED`).

### 2. Actual Blockchain Integration (Hyperledger Besu / Ethereum-Compatible)
- **Zero Voter PII On-Chain**: No citizen identifiers, names, Aadhaar digits, passwords, or plaintext candidate selections are transmitted to the blockchain.
- **Cryptographic Nullifier**: Ballots use an election-specific SHA-256 nullifier:
  $$\text{Nullifier} = \text{SHA-256}(\text{electionId} \parallel \text{voterSecret})$$
- **Smart Contract**: `SovereignDemocracyVoting.sol` records ballot commitments, enforces duplicate nullifier rejection, emits audit events, and accepts certified final tally commitments.
- **Web3j Backend Service**: `BlockchainService` interacts with the Besu / Hardhat RPC endpoint, performs confirmation checks, handles retries, and reconciles pending transactions.

### 3. PDF Candidate Import (Apache PDFBox)
- **PDFBox Text Extraction**: Administrators can upload nomination PDFs (max 5MB) using `org.apache.pdfbox`.
- **Structured Layout Parsing**: Supports both pipe/comma-delimited tables and key-value sections.
- **Interactive Review & Inline Correction**: Extracted candidates are displayed in a preview table with validation badges. Administrators can edit names, codes, parties, and symbols directly in the table.
- **Atomic Persistence**: Confirmation invokes a transactional import into `candidates` and records an administrative audit entry.

### 4. Blockchain-Backed Receipt Verification
- **Dual Verification Model**: Receipt hashes are verified against both local MySQL ballot records and the blockchain event log.
- **Audit Details**: Exposes transaction hash, block number, contract address, on-chain commitment match status, and finality confirmation.
- **Declared Tally Verification**: Certified election tallies publish a SHA-256 tally commitment on-chain, allowing public verification that published winner tallies match the sealed blockchain commitment.

### 5. Blockchain Block Height Reset & Genesis (#0) Restart
- **JSON-RPC Genesis Reset**: Accessible by administrators via `POST /api/blockchain/reset` and an interactive UI button with safety modal.
- **Hardhat EVM Reset**: Issues `hardhat_reset` JSON-RPC call directly to the local dev node, resetting the blockchain ledger back to Block #0.
- **Database Synchronization**: Flushes MySQL `blockchain_transactions`, unbinds existing contract addresses, and resets telemetry so that the block height reads strictly `0` until new transactions or deployments occur.
- **Zero-Block Verification**: Guarantees that resetting starts cleanly at Block 0 without artificial increments.

### 6. Ultra-Fast Direct Web3j Contract Deployment & Tally Deadlock Prevention
- **In-Memory EVM Deployment**: Replaced slow external shell processes (`npx hardhat deploy`) with direct Web3j raw bytecode contract deployment. Deployment latency dropped from 50+ seconds to < 40 milliseconds.
- **Smart Contract Caching**: Implemented `contractVerified` check so subsequent operations avoid redundant re-deployments.
- **Transactional Deadlock Elimination**: Resolved MySQL row-locking deadlock between election tally declaration and blockchain transaction confirmation by utilizing `Propagation.REQUIRED`. Result declaration and tally publishing latency decreased from over 50,000 ms to ~31 ms.
- **Declared Tallies Telemetry**: `DashboardStatsDto` tracks `publishedElections` correctly, updating the "Declared Tallies" counter in real-time as elections are certified.

### 7. Area-Wise Filtering & 500-Voter Roll Directory
- **Full Roll Display (500 Voters)**: Voter management supports full 500-voter roll display (`size=500`) across all 10 initial metropolitan areas.
- **Area-Wise Dropdown Filters**: Both the **Authorized Voter Roll** and the **Voter Participation Tracker** provide instant dropdown filtering by Area/City (Mumbai, Delhi, Bengaluru, Pune, Hyderabad, Kolkata, Chennai, Ahmedabad, Jaipur, Lucknow).
- **Consolidated Turnout Tracking**: Added `"🌐 All Areas & Elections (Show All Voters)"` mode (`/api/elections/all/voter-participation`) displaying nationwide participation status (`Voted` / `Not Voted`) without exposing ballot choices.
- **Instant Search**: Real-time multi-field search by Voter ID, citizen name, or Aadhaar last 4 digits.

### 8. Google Gemini AI Civic Intelligence & Operational Insights
- **Area-Wise Turnout & Velocity Insights**: Spring Boot and MySQL calculate real-time turnout %, 15-minute sliding window voting speed (ballots/min), speed acceleration/deceleration %, and participation tiers (LOW/NORMAL/HIGH). Aggregated non-sensitive metrics are sent to Google Gemini (`gemini-3.8-flash`) to generate structured civic analysis (`summary`, `observations`, `recommendations`, `limitations`).
- **AI Civic Voter Assistant**: Grounded civic assistant widget integrated into the citizen UI (`POST /api/ai/assistant/chat`). Answers queries regarding voter registration, secret voting key usage, election eligibility, and receipt verification with strict guardrails against prompt injection, administrative actions, revealing secret keys, or casting votes.
- **AI-Assisted Candidate PDF Extraction Fallback**: Recovers and parses unstructured PDF text into validated candidate rosters when Apache PDFBox regex parsing encounters malformed or complex table layouts (`POST /api/ai/candidates/pdf-assistance`).
- **Post-Election Executive Audit & Tally Report**: Generates an authoritative post-election executive synthesis (`POST /api/ai/elections/{id}/report`) for declared elections, analyzing area turnout, blockchain commitment integrity, winning margin, and administrative audit logs.
- **Deterministic Resilience & Privacy**: Fully functional even when Gemini is unconfigured or rate-limited via deterministic fallback generators. Zero PII, Aadhaar numbers, or secret keys are ever transmitted to external AI endpoints.

### 9. Isolation Forest Machine Learning Anomaly Detection
- **Pure Java Isolation Forest Model**: Implements Liu, Ting, and Zhou (2008) Isolation Forest algorithm natively within Spring Boot without external Python runtime dependencies. Uses an ensemble of 100 randomized isolation decision trees, sub-sampling size of 256, and recursive path-length scoring:
  $$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
  where $E(h(x))$ is average path length across all 100 trees and $c(n) = 2 \ln(n-1) + 0.5772156649 - \frac{2(n-1)}{n}$ is average path length of unsuccessful searches in Binary Search Trees.
- **7-Dimensional Operational Telemetry Vector**:
  1. `acceptedBallotsPerMin`: Current accepted ballots per minute in 15-minute window.
  2. `failedSubmissionsCount`: Unsuccessful ballot submission attempts in last 15 minutes.
  3. `rejectedDuplicateAttempts`: Blocked duplicate vote attempts recorded in audit logs.
  4. `authFailuresCount`: Failed citizen and administrator login attempts.
  5. `pendingBlockchainTxCount`: Number of ballots currently awaiting blockchain confirmation.
  6. `blockchainLatencySec`: Average transaction confirmation latency in seconds.
  7. `speedVsBaselineDiff`: Absolute variance between current voting speed and area baseline.
- **Anomaly Severity Thresholds**:
  - $s < 0.60$: `NORMAL` — Telemetry strictly within expected municipal baseline parameters.
  - $0.60 \le s \le 0.75$: `WARNING` — Moderate divergence detected in operational telemetry.
  - $s > 0.75$: `CRITICAL` — High anomaly probability requiring immediate administrative investigation.
- **Grounding & Gemini Remediation**: For alerts exceeding $s \ge 0.60$, the system computes top metric contributions, combines them with primary diagnostic reasons, and optionally prompts Google Gemini for actionable technical remediation recommendations (e.g. database connection pool sizing, RPC retry configuration).
- **Audit Persistence & Review Workflow (Flyway V5)**:
  - Table `anomaly_alerts` created via Flyway migration `V5__anomaly_alerts.sql`.
  - Review states: `PENDING_REVIEW` ➔ `REVIEWED`, `CONFIRMED_INCIDENT`, or `DISMISSED`.
  - Administrators can review, assign severity, record operational notes, and track resolution history via `PATCH /api/ai/anomalies/{alertId}/review`.
- **Reproducible Evaluation**: Verified via `backend/scripts/train_isolation_forest.py` on synthetic municipal datasets with 100% recall across 4 real-world operational fault scenarios: Vote Flooding, Credential Stuffing, Duplicate Vote Storm, and Blockchain Node Stalling.
- **Non-Interference Guarantee**: Anomaly detection operates in a strictly read-only audit capacity. Anomaly scores and alerts **never** block eligible voters, reject cast ballots, or alter certified election results.

### 10. Public AI Election Insights & Civic Transparency
- **Unauthenticated Civic Dashboard**: Dedicated public endpoint `GET /api/ai/elections/{id}/public-insights` and responsive frontend component on the homepage allowing citizens and unauthenticated visitors to inspect live election participation.
- **Civic Telemetry Indicators**:
  - Overall Turnout Percentage: $\text{Turnout} = \frac{\text{Accepted Ballots}}{\text{Eligible Roll}} \times 100$.
  - 15-Minute Voting Velocity: Rolling accepted ballots per minute.
  - Velocity Acceleration / Deceleration: Percentage change compared to previous 15-minute window.
  - Participation Trend: `INCREASING` ($\Delta > +5\%$), `DECREASING` ($\Delta < -5\%$), or `STABLE`.
  - Participation Tier: `LOW` ($< 25\%$), `NORMAL` ($25\% - 65\%$), `HIGH` ($> 65\%$).
  - Area-Wise Breakdown: Comparison of turnout across municipal jurisdictions with Recharts visualizations.
- **Neutral Gemini Civic Synthesis**: Generates a neutral, objective 2-sentence civic summary explaining voting activity and operational pace without speculative, partisan, or candidate-specific commentary.
- **Zero PII Exposure Guarantee**: Public insights endpoints strictly expose only aggregated civic statistics. Zero citizen names, Election IDs, Aadhaar digits, secret voting keys, or candidate vote totals are included.

---

## 🔐 Feature: Secure Password Recovery, Firebase Security Auditing & Identity Conventions

### 1. Account Recovery Email Conventions
- **Root Administrator Account**:
  - Username: `ADMIN-001`
  - Designated Recovery Email: `akhilv.verma07@gmail.com`
  - Seeded automatically on startup and synchronized across application runs.
- **Citizen / Voter Accounts**:
  - Identifier: Election ID (e.g., `VOT-MUM-1001`, `VOT-DEL-2001`)
  - Standardized Email Syntax: `nameaadharnumber@gmail.com` (no space, no plus sign)
  - Generation Algorithm:
    $$\text{Recovery Email} = \text{LOWERCASE}(\text{REPLACE}(\text{fullName}, \text{" "}, \text{""})) \parallel \text{aadhaarLast4} \parallel \text{"@gmail.com"}$$
  - Examples:
    - Citizen **Aarav Verma** (Aadhaar `2017`) &rarr; `aaravverma2017@gmail.com`
    - Citizen **Ananya Deshmukh** (Aadhaar `2034`) &rarr; `ananyadeshmukh2034@gmail.com`
    - Citizen **Rahul Jadhav** (Aadhaar `2051`) &rarr; `rahuljadhav2051@gmail.com`
  - **Single Active Account & On-Demand Enrollment**: Exactly one demonstration citizen account (`VOT-MUM-1001`, password: `pass123`) is pre-activated on initialization. The remaining 499 enrolled citizen records are in `Ready to Sign Up` status and can be activated on-demand by the citizen by verifying their 4-digit Aadhaar number and creating their password.
  - **Citizen Registration Binding**: When unregistered voters activate their accounts via `POST /api/auth/register`, their calculated recovery email is automatically stored in `user_accounts.recovery_email`.
  - **Full Unmasked Email Visibility**: Full email IDs are displayed for transparency across the citizen roster, registration confirmation card, and voter dashboard.
  - **Zero-PII Public Roll & Aadhaar Confidentiality**: Aadhaar numbers are never transmitted or exposed to normal users. Regular users see `Protected • Zero PII` and `Official Roll Verified`, while only authenticated administrators can view Aadhaar details.
  - **Authenticated Citizen Dossier**: Upon logging in, the personal voter dashboard renders the verified electoral profile card showing Voter Name, Father's Name, Mother's Name, City/Jurisdiction, and full Recovery Email.

### 2. Cryptographic Password Reset Flow
- **Single-Use Token Generation**: Cryptographically secure 256-bit entropy random tokens generated via `SecureRandom`.
- **SHA-256 Storage**: The raw token is hashed using SHA-256 before persisting in `password_reset_tokens`. Plaintext tokens are never stored in the database or logged in application logs.
- **20-Minute Token TTL**: Tokens expire after 20 minutes and are permanently invalidated once consumed (`used_at`) or when superseded.
- **Enumeration & Timing Defense**: Forgot-password queries return an identical, standardized response regardless of whether the account exists or has an eligible recovery email.
- **URL Hash Fragment Delivery**: Password reset links format the token in the URL fragment (`#token=...`) so it is never transmitted in HTTP `Referer` headers. Upon mounting in React, `window.history.replaceState` sanitizes the address bar.
- **Stateless JWT Revocation**: When a password is reset, `password_changed_at` is updated in MySQL, and `JwtAuthenticationFilter` rejects any previously issued tokens without requiring an external session store.

### 3. Supplementary Firebase Auditing & Outbox Pattern
- **MySQL Outbox (`firebase_audit_outbox`)**: All security events (`PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_SUCCESSFUL`, `PASSWORD_RESET_FAILED`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`) are transactionally persisted in MySQL first.
- **Non-Blocking Supplementary Dispatch**: Events are asynchronously delivered to Firebase Firestore. Failure to reach Firebase never impacts voting, user authentication, or database transactions.
- **Direct REST API Client**: Built directly on Google Cloud Firestore REST API with service account / bearer token authentication, eliminating heavyweight gRPC background thread hangs.
- **Idempotent Document Writing**: Events use deterministic document keys `evt_{outboxId}_{timestamp}` preventing duplicated writes across retry cycles.
- **Confirmed Delivery Guarantee**: Outbox records transition from `PENDING` to `DELIVERED` only after HTTP 200 OK delivery confirmation from Cloud Firestore.
- **Admin Outbox Telemetry & Retry**: Administrators can inspect real-time outbox delivery metrics (Pending, Delivered, Failed) in the Admin Dashboard and invoke manual or automated retry cycles via `POST /api/admin/security-audit/retry-outbox`.
- **Audit Outbox & Firestore Reset Capability**:
  - Supports clean staging resets: MySQL `firebase_audit_outbox` can be safely truncated (`TRUNCATE TABLE firebase_audit_outbox;`) and remote Firestore documents in `security_audit_logs` deleted via REST API without altering core voting or user records.
- **Member Metadata Sync**: Non-sensitive operational metadata (username, role, voter jurisdiction, registration status, password changed timestamp) is safely synced. Passwords, hashes, secret voting keys, and ballot choices are strictly forbidden from Firebase transmission.
- **Zero-Trust Client Access**: Firestore security rules (`firestore.rules`) completely deny all client-side direct reads and writes.

### 4. Dynamic Client IP Address Resolution & Audit Logging
- **Multi-Header IP Extraction**: `ClientIpResolver` resolves client IP addresses dynamically by inspecting:
  1. `X-Forwarded-For` (first non-internal client address in proxy chains)
  2. `X-Real-IP` (direct reverse proxy header)
  3. `HttpServletRequest.getRemoteAddr()` (direct socket fallback)
- **Real Network IP Capture**: Live caller network IPs (e.g. `10.195.254.116` or host IP) are recorded directly into MySQL `audit_logs` and Firebase security events rather than dummy localhost strings.
- **Database Migration V6**: Updated existing legacy localhost audit entries via Flyway `V6__update_audit_log_ips.sql` to maintain clean audit records.

---

## 🔒 Architecture Decisions & Security Limitations


### 1. Vote Secrecy Design
- The system achieves ballot confidentiality by **splitting participation from choice**:
  - `VoteParticipation` stores `(election_id, voter_record_id, voted_at)` with a unique constraint to prevent double-voting.
  - `BallotRecord` stores `(election_id, candidate_id, ballot_hash, cast_at)` without any foreign key to `voter_records` or `user_accounts`.
- *Limitation*: In a small election with few voters, correlation by timestamp could theoretically be attempted if database transactions are inspected at the microsecond level. In a production statutory election, homomorphic encryption, shuffle-nets, or zero-knowledge verifiable mixing must be used.

### 2. Machine Learning Anomaly Detection Limitations
- The Isolation Forest model operates on **aggregated operational telemetry** and synthetic municipal baseline distributions.
- *Limitation*: Anomaly scores are technical diagnostic heuristics and **do not prove fraud or catch individual fraudulent voters**. False positives may occur during legitimate voter surges (e.g., lunchtime or evening civic rush). All critical anomalies must undergo multi-stakeholder operational review.

### 3. Aadhaar Last 4 Digits
- The prototype verifies only the **last 4 digits** of the Aadhaar number as a demonstration credential.
- *Limitation*: The last 4 digits are not a substitute for cryptographically certified biometric or PKI-based national identity verification in a sovereign general election.

### 4. Single Administrator Authority
- For prototype management, one central administrator oversees area and candidate configuration.
- *Limitation*: A single administrative account creates a concentration of authority. Real-world statutory elections require separation of duties across multiple independent commissioners using multi-party threshold cryptography ($k$-of-$n$ key sharing).

---

## 📄 License
This project is licensed under the MIT License for educational and prototyping purposes.
