# Team Management System

A comprehensive full-stack team management and task tracking platform built with **Next.js 16**, **Supabase**, and **React**. Organize your teams, manage employees, departments, and tasks with role-based access control.

## Features

- **Team Management**: Organize employees into departments with hierarchical management
- **Employee Management**: Add, update, and manage employee information, positions, and salary data
- **Task Tracking**: Create, assign, and track tasks across departments with Kanban-style board
- **Department Management**: Create and manage departments with dedicated managers
- **Role-Based Access Control**: Three-tier permission system (Admin, Manager, Employee)
- **Real-time Synchronization**: All data updates are reflected in real-time across the application
- **Dashboard Analytics**: Overview of team metrics and task completion rates

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Next.js App Router with Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **UI Components**: shadcn/ui with Tailwind CSS
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Supabase project (free tier available at [supabase.com](https://supabase.com))

### Installation

1. **Clone or extract the project**

2. **Install dependencies**:
```bash
pnpm install
```

3. **Set up environment variables**:

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To find your Supabase credentials:
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click "Settings" → "API"
4. Copy the "Project URL" and "anon public" key

4. **Run the development server**:

```bash
pnpm dev
```

5. **Open the application**:

Navigate to `http://localhost:3000` in your browser.

## Database Schema

The application uses the following main tables:

- **profiles**: User profiles linked to Supabase Auth with roles
- **departments**: Company departments with assigned managers
- **employees**: Employee records with department assignments and salary info
- **tasks**: Tasks assigned to employees with status tracking
- **subtasks**: Sub-tasks for decomposing larger tasks
- **comments**: Comments on tasks for collaboration

All tables have Row Level Security (RLS) policies to ensure data privacy based on user roles.

## Project Structure

```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Home page with landing
├── auth/
│   ├── login/page.tsx        # Login page
│   ├── sign-up/page.tsx      # Sign up page
│   ├── callback/route.ts     # OAuth callback handler
│   └── error/page.tsx        # Auth error page
└── dashboard/
    ├── layout.tsx            # Dashboard layout with navigation
    ├── page.tsx              # Dashboard overview
    ├── employees/page.tsx    # Employee management
    ├── departments/page.tsx  # Department management
    ├── tasks/page.tsx        # Task tracking with Kanban
    └── roles/page.tsx        # Role management

components/
├── ui/                        # shadcn/ui components
├── dashboard/
│   ├── dashboard-nav.tsx     # Navigation sidebar
│   ├── employee-form.tsx     # Employee form component
│   ├── employee-list.tsx     # Employee list view
│   └── ...                   # Other dashboard components

lib/
├── supabase/
│   ├── client.ts             # Supabase client for browser
│   ├── server.ts             # Supabase client for server
│   └── proxy.ts              # Session proxy handler
└── utils.ts                  # Utility functions

middleware.ts                  # Next.js middleware for auth

prisma/
└── schema.prisma             # Database schema (reference only)
```

## User Roles & Permissions

### Admin
- Full access to all system features
- Manage all users and assign roles
- Create and delete departments
- View all employee data
- Access all reports and analytics

### Manager
- Manage employees in their assigned department
- Create and assign tasks
- View department tasks and reports
- Update task status
- Manage team schedules

### Employee
- View assigned tasks
- Update task status
- View team information
- Submit task updates
- View department information

## Authentication Flow

1. Users sign up or log in with email and password
2. Supabase Auth handles password hashing and session management
3. A profile is automatically created in the `profiles` table
4. User role is stored in the profile and enforced via RLS policies
5. Protected routes in the `/dashboard` require authentication

## Key Features

### Dashboard
- Overview of team metrics (employees, departments, tasks)
- Task completion rate visualization
- Quick access to all management features

### Employee Management
- Add/edit/delete employees
- Assign employees to departments
- Set positions and salary information
- Track employee status (Active, Inactive, On Leave)
- Search and filter employees

### Department Management
- Create departments with icons
- Assign managers to departments
- View all department information
- Manage department hierarchy

### Task Management
- Create tasks with detailed descriptions
- Assign tasks to team members
- Set priorities and due dates
- Track task status (To Do, In Progress, Review, Completed)
- Kanban-style board view with automatic categorization
- Filter tasks by department

### Roles Management
- View user roles and permissions
- Edit user roles (requires admin access)
- Manage role-based access control
- Track role-based activity

## Row Level Security (RLS)

All sensitive data is protected with RLS policies:

- Users can only see their own profile information
- Managers can only see and manage their department's employees and tasks
- Employees can only see assigned tasks
- Admins have full access to all data

## Environment Variables

Create a `.env.local` file with these variables:

```
# Required
NEXT_PUBLIC_SUPABASE_URL=                    # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=              # Your Supabase anon key

# Optional for development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=      # Override auth callback URL
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel project settings
4. Deploy automatically on push

### Deploy to Other Platforms

The application can be deployed to any platform that supports Node.js:

1. Set environment variables in your deployment platform
2. Run `pnpm build`
3. Run `npm start` or use your platform's deployment configuration

## Development

### Adding New Features

1. Update the database schema if needed (in Supabase dashboard)
2. Create new page/component files
3. Use Supabase client for data operations
4. Test authentication and RLS policies
5. Deploy when ready

### Database Migrations

To make schema changes:

1. Go to Supabase dashboard → SQL Editor
2. Write and test your migration
3. Apply it to your database
4. Update relevant queries in your application code

## Troubleshooting

### Authentication Issues

- **"User not found" error**: Make sure you've signed up and confirmed your email
- **"Invalid session" error**: Try logging out and logging back in
- **"Permission denied" error**: Check your user role and RLS policies

### Database Issues

- **"RLS policy violation" error**: Ensure you're performing actions allowed by your role
- **Connection timeout**: Check your Supabase project status and network connection
- **Data not appearing**: Verify RLS policies allow the operation

### Build Issues

- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Check environment variables: Ensure `.env.local` is properly configured

## Support

For issues and questions:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Check console logs for detailed error messages
4. Review RLS policies in Supabase dashboard

## License

This project is open source and available under the MIT License.
