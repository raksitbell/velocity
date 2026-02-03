# 🚀 Velocity: AI-Powered Project Management

**Velocity** is a high-performance, intelligent project management tool designed to bridge the gap between your project planning (Kanban) and your code repositories (GitHub/GitLab). By synchronizing tasks with issues in real-time, it keeps developers and product managers on the exact same page.

![Status](https://img.shields.io/badge/Status-Active_Development-green)
![Stack](https://img.shields.io/badge/Stack-Angular_19_+_NestJS-red)

---

## 🏗 Tech Stack Deep Dive

We have chosen a robust, enterprise-grade stack optimized for scalability, type safety, and modern performance standards.

### 🎨 Frontend: The Client (`/client`)
- **Framework:** **Angular 19+**
  - Uses **Signals** for fine-grained reactivity and state management.
  - **Standalone Components** for a lightweight, modular architecture.
- **Styling:** **Tailwind CSS v4**
  - Configured with PostCSS for next-gen utility-first styling.
  - Ensures a consistent, accessible, and premium design language.
- **Drag & Drop:** `@angular/cdk/drag-drop`
  - Native, accessible drag-and-drop primitives for the Kanban board.
- **Icons:** `lucide-angular` for a clean, consistent icon set.

### ⚙️ Backend: The Server (`/server`)
- **Framework:** **NestJS**
  - A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
  - Utilizes a modular architecture (Modules, Controllers, Services).
- **Database:** **PostgreSQL**
  - Robust relational database for complex data modeling (User <-> Task <-> Repo).
- **ORM:** **Prisma**
  - Type-safe database access and automated migrations.
- **Job Queue:** **Inngest**
  - Durable background function orchestration for reliable two-way sync (Webhooks -> Database).
- **Authentication:** **Passport.js / Auth.js**
  - Secure OAuth2 authentication strategies.

---

## 🛠 Project Architecture

The project is structured as a monorepo with a clear separation of concerns:

```plaintext
velocity/
├── client/                 # Angular Frontend Application
│   ├── src/
│   │   ├── app/            # Feature modules and components
│   │   ├── environments/   # Environment configurations
│   │   └── styles.css      # Global Tailwind styles
│   ├── angular.json        # CLI Configuration
│   └── tailwind.config.js  # Styling Configuration
├── server/                 # NestJS Backend API
│   ├── src/
│   │   ├── modules/        # Feature-based collection of modules
│   │   ├── prisma/         # Database service definition
│   │   └── main.ts         # Application entry point
│   ├── prisma/             # Schema definition and migrations
│   └── package.json
└── README.md               # Project Documentation
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v20 or higher.
- **PostgreSQL**: Local instance or Docker container.
- **Git**: For version control.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/velocity.git
   cd velocity
   ```

2. **Install Server Dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### 💻 Development

You will need two terminals to run the full stack:

**Terminal 1: Backend (Server)**
```bash
cd server
npm run start:dev
# Running on http://localhost:3000
```

**Terminal 2: Frontend (Client)**
```bash
cd client
npm start
# Running on http://localhost:4200
```

### 🗄 Database Setup (Prisma)

1. Navigate to the server directory: `cd server`
2. Create your `.env` file and set your `DATABASE_URL`.
3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Generate the client:
   ```bash
   npx prisma generate
   ```

---


## 📜 Changelog

### v0.1.0-beta
- **Initial Release**: Launched Velocity
- **Core Stack**: Angular 19+ (Client) & NestJS (Server).
- **Features**:
  - Project Initialization & Monorepo Structure.
  - Kanban Board UI (In Progress).
  - GitHub/GitLab Sync Engine (Planned).

---

## 🤝 Maintenance & Contribution

- **Code Style**: We follow standard Angular and NestJS style guides.
- **State Management**: Prefer Angular Signals for local state and lightweight global stores.
- **API Design**: RESTful conventions managed by NestJS Controllers.

---
*Built with ❤️ by the Bellbox Team.*
