# Quick Start Guide

Get the Team Management System up and running in 5 minutes.

## 1. Clone or Download

If you're in v0, download the project. If using GitHub:

```bash
git clone https://github.com/yourusername/team-management-system.git
cd team-management-system
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Set Up Supabase

**Free Option:**

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Go to "Settings" → "API"
5. Copy your Project URL and anon key

**Create `.env.local`:**

```bash
echo 'NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here' > .env.local
```

## 4. Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## 5. Create First Account

1. Go to Sign Up page
2. Enter email and password
3. Verify your email
4. Log in

## 6. Set Up Demo Data

**Create First Department:**

1. Go to Departments
2. Click "Add Department"
3. Enter "Engineering" as name
4. Select yourself as manager
5. Click "Add Department"

**Add Employees:**

1. Go to Employees
2. Click "Add Employee"
3. Select your profile
4. Choose Engineering department
5. Add position and details
6. Click "Add Employee"

**Create Tasks:**

1. Go to Tasks
2. Click "Add Task"
3. Enter task title and description
4. Select Engineering department
5. Assign to an employee
6. Click "Add Task"

## Key Features to Try

### Dashboard
- Overview of team metrics
- Task completion rate
- Employee and department counts

### Departments
- Create multiple departments
- Assign different managers
- View department info

### Employees
- Add employees with positions and salary
- Track employment status
- Assign managers
- Filter by department

### Tasks
- Create and manage tasks
- Drag-drop between columns in Kanban view
- Set priority levels
- Track task progress

### Roles
- View user roles (Admin, Manager, Employee)
- Change user roles (requires admin access)
- Understand role-based permissions

## Admin Features

To access admin features, you need the ADMIN role. To set yourself as admin:

1. Go to Supabase dashboard
2. Go to "SQL Editor"
3. Run this query:
```sql
UPDATE profiles 
SET role = 'ADMIN' 
WHERE id = 'your_user_id';
```

Then refresh the app.

## Common Tasks

### Change Password

1. Sign out
2. Click "Sign in"
3. Click "Forgot password"
4. Enter email
5. Check email for reset link
6. Set new password

### Add New Users

Use "Create Account" link on login page. New users are created as EMPLOYEE by default. Admins can change roles in the Roles page.

### Delete Data

- Employees: Click Delete button (also removes from all tasks)
- Departments: Click Delete button (cascades to employees and tasks)
- Tasks: Click Delete button

### Export Data

Currently not implemented, but you can:
1. Go to Supabase dashboard
2. Use SQL queries to export data
3. Export to CSV or JSON

## Troubleshooting

### "Connection refused" error

- Make sure dev server is running (`pnpm dev`)
- Check if port 3000 is available
- Try different port: `pnpm dev -- -p 3001`

### "Invalid credentials" error

- Double-check your Supabase URL and key
- Make sure .env.local file exists
- Restart dev server after changing .env.local

### "RLS policy violation" error

- You don't have permission for this action
- Check your user role
- Admins can do anything
- Managers can manage their department
- Employees can only view their tasks

### "Email confirmation required"

- Check your email for confirmation link
- Click the link to verify
- Log in after verification

### Tables not appearing

- Database schema not created
- Check Supabase SQL Editor for tables
- Run the migration script from Supabase dashboard

## Next Steps

1. **Customize**: Edit colors, fonts, and branding in globals.css
2. **Add Features**: Create new pages under /dashboard
3. **Deploy**: Follow DEPLOYMENT.md guide
4. **Integrate**: Connect to your existing systems via API

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## Need Help?

1. Check the README.md for detailed information
2. Review error messages in browser console
3. Check Supabase logs for database errors
4. Look at deployment troubleshooting in DEPLOYMENT.md

Happy building! 🚀
