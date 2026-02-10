# 🚀 Velocity: Serverless AI-Powered Project Management

![Status](https://img.shields.io/badge/Status-Active_Development-green)
![Stack](https://img.shields.io/badge/Stack-Angular_19_+_Supabase-teal)
![License](https://img.shields.io/badge/License-MIT-blue)

**Velocity** is a high-performance, intelligent project management tool designed to bridge the gap between your project planning (Kanban) and your code repositories. By synchronizing tasks with issues in real-time, it keeps developers and product managers on the exact same page.

> **Note**: This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.19.

---

## 🌟 Features

- **Auth Integration**: Secure Email/Password authentication powered by Supabase.
- **Kanban Boards**: Trello-like drag-and-drop interface for managing tasks.
- **Issue Tracking**: Jira-style ticketing system with priorities and assignees.
- **Documentation**: Notion-like rich text editor for project specs.
- **Real-time Sync**: (Planned) Live updates across all clients.
- **Activity Logging**: Track user actions like creating, moving, and updating tasks.

---

## 🛠 Tech Stack

We utilize a modern, serverless architecture for maximum scalability and developer experience.

### 🎨 Frontend (`/client`)
- **Framework:** **Angular 19**
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
- **Angular CLI**: `npm install -g @angular/cli`

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
   - Run the SQL scripts located in `client/src/supabase/migrations/` (start with table creations).
   - This creates all necessary tables (workspaces, projects, tasks, activity_logs, etc.).

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
The application will automatically reload whenever you modify any of the source files.

---

## 📦 Development Workflow

### Code Scaffolding
Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Building
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running Tests
- **Unit Tests**: Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
- **End-to-End Tests**: Run `ng e2e` to execute the end-to-end tests.

---

## 🧪 Maintenance & Quality

### Contributing
We welcome contributions! Please fork the repo, create a branch, and submit a PR. Follow the standard Angular style guide.

### License
This project is licensed under the MIT License.

---

## 👏 Authors

*Built with ❤️ by the Bellbox Team.*
