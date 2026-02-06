# 🚀 Velocity: Serverless AI-Powered Project Management

**Velocity** is a high-performance, intelligent project management tool designed to bridge the gap between your project planning (Kanban) and your code repositories. By synchronizing tasks with issues in real-time, it keeps developers and product managers on the exact same page.

![Status](https://img.shields.io/badge/Status-Active_Development-green)
![Stack](https://img.shields.io/badge/Stack-Angular_21_+_Supabase-teal)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🌟 Features

- **Auth Integration**: Secure Email/Password authentication powered by Supabase.
- **Kanban Boards**: Trello-like drag-and-drop interface for managing tasks.
- **Issue Tracking**: Jira-style ticketing system with priorities and assignees.
- **Documentation**: Notion-like rich text editor for project specs.
- **Real-time Sync**: (Planned) Live updates across all clients.

---

## 🛠 Tech Stack

We utilize a modern, serverless architecture for maximum scalability and developer experience.

### 🎨 Frontend (`/client`)
- **Framework:** **Angular 21**
  - Uses **Signals** for fine-grained reactivity.
  - **Standalone Components** for modular architecture.
- **Styling:** **Tailwind CSS v3**
  - Utility-first styling with PostCSS.
- **Backend-as-a-Service:** **Supabase**
  - Auth, Database (PostgreSQL), and Row Level Security (RLS).
- **Libraries**:
  - `@angular/cdk/drag-drop` (Kanban)
  - `lucide-angular` (Icons)
  - `date-fns` (Date manipulation)

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v20 or higher.
- **Supabase Account**: create a project at [supabase.com](https://supabase.com).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/velocity.git
   cd velocity
   ```

2. **Install Client Dependencies:**
   ```bash
   cd client
   npm install
   ```

3. **Database Setup (Supabase):**
   - Create a new Project in Supabase.
   - Go to the **SQL Editor** in Supabase.
   - Run the SQL script located at `client/src/supabase/schema.sql`.
   - This creates all necessary tables (workspaces, boards, tasks, etc.).

4. **Environment Setup:**
   - Open `client/src/environments/environment.ts`.
   - Update `supabaseUrl` and `supabaseKey` (Anon Key) from your Supabase Project Settings.

### 💻 Usage (Development)

Run the development server:

```bash
cd client
npm start
# The app will run on http://localhost:4200
```

---

## 🧪 Maintenance & Quality

### Tests
Run the test suite to ensure stability:
```bash
npm test
```

### Contributing
We welcome contributions! Please fork the repo, create a branch, and submit a PR. Follow the standard Angular style guide.

### License
This project is licensed under the MIT License.

---

## 👏 Authors

*Built with ❤️ by the Bellbox Team.*
