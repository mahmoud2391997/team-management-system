# Team Management System

A modern, full-featured team management and project tracking application built with Next.js 16, Supabase, and TypeScript.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Features Guide](#key-features-guide)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [API Routes](#api-routes)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)

## Features

### Core Features
- **Department Management**: Create and manage organizational departments with managers
- **Employee Management**: Add, edit, and manage team members with roles and positions
- **Task Management**: Create tasks with priority levels, due dates, and status tracking
- **Kanban Board**: Visual task management with drag-and-drop functionality
- **Employee Details**: Comprehensive employee profiles with task history and statistics
- **Search & Pagination**: Search employees by name/email with paginated results
- **Dashboard**: Real-time overview with task statistics and recent activity
- **404 Error Page**: User-friendly error handling

### Task Management
- Priority levels: Low, Medium, High, Urgent
- Status tracking: To Do, In Progress, Review, Completed
- Due date assignment
- Department and employee assignment
- Task history and completion tracking
- Kanban-style board visualization

### Employee Management
- Full employee profiles with contact information
- Role-based access control (Admin, Manager, Employee)
- Department assignment
- Position and salary tracking
- Join date records
- Employee detail pages with assigned tasks and statistics
- Search and filter by name, email, or department
- Pagination with 10 items per page

### Dashboard & Analytics
- Real-time statistics on employees, departments, and tasks
- Task completion rate tracking
- Recent tasks overview
- Task status distribution (To Do, In Progress, Review, Completed)
- Visual progress indicators
- Quick navigation to all management features

## Tech Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **UI Library**: React 19.2+
- **Styling**: Tailwind CSS 4
- **Component Library**: shadcn/ui
- **Icons**: Lucide React
- **Type Safety**: TypeScript

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Client**: Supabase JavaScript Client

### DevOps & Deployment
- **Hosting**: Vercel
- **Version Control**: Git

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm, yarn, pnpm, or bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mahmoud2391997/team-management-system.git
   cd team-management-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or npm install, yarn install, bun install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
team-management-system/
├── app/
│   ├── (dashboard)/              # Dashboard routes
│   │   ├── dashboard/            # Main dashboard page
│   │   ├── employees/            # Employee management
│   │   │   ├── page.tsx          # Employees list
│   │   │   └── [id]/page.tsx     # Employee detail page
│   │   ├── tasks/                # Task management
│   │   ├── departments/          # Department management
│   │   └── notifications/        # Notifications page
│   ├── auth/                     # Authentication routes
│   ├── actions/                  # Server actions
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   ├── not-found.tsx             # 404 error page
│   └── globals.css               # Global styles
├── components/
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── employees-container.tsx
│   │   ├── tasks-container.tsx
│   │   ├── task-form.tsx
│   │   ├── employee-form.tsx
│   │   └── permissions-context.tsx
│   ├── ui/                       # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── employee-detail-modal.tsx
│   │   └── task-detail-modal.tsx
│   └── auth/                     # Auth components
├── lib/
│   ├── actions/                  # Server actions & data fetching
│   │   └── data-actions.ts
│   ├── auth.ts                   # Auth utilities
│   ├── permissions.ts            # Role-based access control
│   ├── supabase.ts              # Supabase client setup
│   ├── types.ts                 # TypeScript type definitions
│   ├── hooks/                   # Custom React hooks
│   └── utils/                   # Utility functions
├── prisma/                      # Prisma configuration
├── public/                      # Static assets
├── middleware.ts                # Authentication middleware
└── package.json
```

## Key Features Guide

### Dashboard
The dashboard provides a real-time overview of your organization:
- **Key Metrics**: Total employees, departments, tasks, and completion rate
- **Task Status Overview**: Visual breakdown of tasks by status with progress bars
- **Recent Tasks**: Latest tasks with priority and status indicators
- **Quick Navigation**: Links to manage departments, employees, and tasks

### Employee Management
1. **View Employees**: Access the employees page to see all team members
2. **Search & Filter**: Search by name/email and filter by department
3. **Pagination**: Browse through employee lists with page-based navigation (10 per page)
4. **Add Employee**: Create new team members with role and department assignment
5. **View Details**: Click on an employee to see comprehensive profile with assigned tasks
6. **Edit/Delete**: Update employee information or remove from team

### Task Management
1. **Kanban Board**: View tasks organized by status columns
2. **Drag & Drop**: Reorganize tasks between status columns
3. **Create Tasks**: Add new tasks with priority, due date, and assignee
4. **Task Details**: View complete task information and history
5. **Filter**: Filter tasks by department
6. **Priority Levels**: Organize by urgency (Low, Medium, High, Urgent)

### Department Management
1. **Create Departments**: Set up organizational units with managers
2. **Assign Manager**: Link department managers to manage team members
3. **Edit/Delete**: Update department details or remove departments
4. **Icon Customization**: Add emoji icons to departments for visual identification

### Employee Detail Page
- Comprehensive profile information
- Task statistics and completion rates
- All assigned tasks with status and priority
- Visual progress indicators
- Task completion timeline

## Database Schema

### Main Tables

#### Profiles
```sql
- id: UUID (primary key)
- email: STRING (unique)
- first_name: STRING
- last_name: STRING
- role: ENUM (Admin, Manager, Employee)
- team_id: UUID
- created_at: TIMESTAMP
```

#### Departments
```sql
- id: UUID (primary key)
- team_id: UUID
- name: STRING
- manager_id: UUID (references profiles)
- icon: STRING
- created_at: TIMESTAMP
```

#### Employees
```sql
- id: UUID (primary key)
- profile_id: UUID (references profiles)
- department_id: UUID (references departments)
- position: STRING
- salary: NUMERIC
- join_date: DATE
- status: ENUM (ACTIVE, ON_LEAVE, INACTIVE)
- created_at: TIMESTAMP
```

#### Tasks
```sql
- id: UUID (primary key)
- department_id: UUID (references departments)
- title: STRING
- description: TEXT
- priority: ENUM (LOW, MEDIUM, HIGH, URGENT)
- status: ENUM (TODO, IN_PROGRESS, REVIEW, COMPLETED)
- assignee_id: UUID (references profiles)
- due_date: DATE
- created_at: TIMESTAMP
```

## Authentication & Authorization

### Role-Based Access Control (RBAC)
- **Admin**: Full system access
- **Manager**: Can manage department employees and tasks
- **Employee**: Can view and update assigned tasks

### Permissions System
Permissions defined in `lib/permissions.ts`:
- `dashboard.view`
- `employees.view`, `employees.create`, `employees.edit`, `employees.delete`
- `tasks.view`, `tasks.create`, `tasks.edit`, `tasks.delete`
- `departments.view`, `departments.create`, `departments.edit`, `departments.delete`

## API Routes

### Server Actions (lib/actions/data-actions.ts)

**Profile Management**
- `getProfile()`: Get current user profile
- `getTeamProfile()`: Get user's team profile

**Dashboard**
- `getDashboardStats()`: Get dashboard statistics

**Employees**
- `getEmployees()`: Fetch all employees
- `createEmployee()`: Create new employee
- `updateEmployee()`: Update employee
- `deleteEmployee()`: Delete employee

**Departments**
- `getDepartments()`: Fetch all departments
- `createDepartment()`: Create department
- `updateDepartment()`: Update department
- `deleteDepartment()`: Delete department

**Tasks**
- `getTasks()`: Fetch all tasks
- `createTask()`: Create task
- `updateTask()`: Update task
- `deleteTask()`: Delete task

## Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Tailwind Configuration
- Custom color palette with semantic naming
- Font: Geist (sans) and Geist Mono
- Responsive design system
- Dark mode support

## Development

### Running Development Server
```bash
pnpm dev
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Code Quality
```bash
pnpm lint
pnpm type-check
```

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

### Manual Deployment
1. Build: `pnpm build`
2. Deploy `.next` directory to your hosting

## Usage Examples

### Creating an Employee
```tsx
const result = await createEmployee({
  profile_id: profileId,
  department_id: deptId,
  position: "Software Engineer",
  salary: 80000,
  join_date: new Date(),
  status: "ACTIVE"
})
```

### Creating a Task
```tsx
const result = await createTask({
  title: "Implement feature",
  priority: "HIGH",
  status: "TODO",
  department_id: deptId,
  assignee_id: employeeId,
  due_date: new Date("2025-02-01")
})
```

## Troubleshooting

**Authentication Errors**
- Verify Supabase credentials in `.env.local`
- Check user is logged in
- Verify permissions are assigned

**Database Issues**
- Confirm Supabase project is active
- Check network connectivity

**Page Not Found**
- Check that dynamic routes are configured properly

## License

MIT License - Open source and available for use

---

**Last Updated**: July 2025
