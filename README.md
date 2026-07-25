# Team Management System

## فكرة المشروع (Project Idea)

نظام لإدارة فريق العمل داخل الشركة، يتيح للمستخدم تسجيل الدخول، واستعراض لوحة تحكم تحتوي على إحصائيات عامة، بالإضافة إلى إدارة بيانات الموظفين، الأقسام، والمهام من خلال واجهة استخدام حديثة ومتجاوبة مع مختلف أحجام الشاشات.

**Key Highlights:**
- Role-based access control (Admin, Manager, Employee)
- Kanban board for task management with drag-and-drop
- Real-time dashboard with charts and statistics
- Email invitations for team members
- Notification system for task assignments, edits, and status changes
- Manual employee entry with automatic email invitations

---

## التقنيات المستخدمة (Technologies Used)

### Frontend
- **Framework**: Next.js 16+ (App Router, Server Actions)
- **UI Library**: React 19.2+
- **Styling**: Tailwind CSS 4
- **Component Library**: shadcn/ui
- **Charts**: Recharts (donut chart for task status overview)
- **Icons**: Lucide React
- **Language**: TypeScript

### Backend & Database
- **Runtime**: Node.js
- **Server**: Next.js Server Actions (no separate API layer)
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (httpOnly cookies) + bcrypt password hashing
- **Email**: Nodemailer (SMTP via Gmail)
- **DB Direct Access**: pg (for schema management)

### DevOps
- **Hosting**: Vercel
- **Version Control**: Git
- **Package Manager**: pnpm

---

## خطوات التشغيل (Run Steps)

### Prerequisites
- Node.js 18 or higher
- pnpm (or npm/yarn/bun)
- A Supabase project (or PostgreSQL database)

### 1. Clone the repository
```bash
git clone https://github.com/mahmoud2391997/team-management-system.git
cd team-management-system
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment variables
Copy the example env file and fill in your values:
```bash
cp .env.example .env
```

Required variables:
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `JWT_SECRET` | Secret key for JWT token signing |
| `SMTP_EMAIL` | Gmail address for sending emails |
| `SMTP_PASSWORD` | Gmail app password |
| `SITE_URL` | Your app URL (e.g., `http://localhost:3000`) |

### 4. Set up the database
Run the SQL schema in your Supabase SQL Editor:
```bash
# The schema file is located at:
supabase/schema.sql
```

### 5. Run the development server
```bash
pnpm dev
```

### 6. Open in browser
Navigate to [http://localhost:3000](http://localhost:3000)

### 7. Create your first account
- Go to **Create Team** to set up your team and admin account
- Start adding departments, employees, and tasks

---

## هيكل المشروع (Project Structure)

```
team-management-system/
├── app/
│   ├── (dashboard)/                  # Protected dashboard routes
│   │   ├── dashboard/page.tsx        # Main dashboard with stats & chart
│   │   ├── employees/
│   │   │   ├── page.tsx              # Employee list with search & pagination
│   │   │   └── [id]/page.tsx         # Employee detail with assigned tasks
│   │   ├── tasks/page.tsx            # Kanban board with drag-and-drop
│   │   ├── departments/page.tsx      # Department management
│   │   ├── members/page.tsx          # Team member management
│   │   ├── notifications/page.tsx    # Notification center
│   │   ├── roles/page.tsx            # Role & permission management
│   │   ├── profile/page.tsx          # User profile settings
│   │   ├── settings/page.tsx         # Team settings & delete
│   │   └── create-team/page.tsx      # Create new team
│   ├── auth/                         # Public auth routes
│   │   ├── login/page.tsx            # Login page
│   │   ├── sign-up/page.tsx          # Sign up page
│   │   └── create-team/page.tsx      # Team creation wizard
│   ├── actions/
│   │   ├── invitations.ts            # Invite, accept/decline, notifications
│   │   ├── create-team.ts            # Team creation logic
│   │   ├── delete-team.ts            # Team deletion with cascade
│   │   └── signup.ts                 # Invited user signup
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Landing page
│   └── not-found.tsx                 # 404 page
│
├── components/
│   ├── dashboard/
│   │   ├── employees-container.tsx   # Employee list logic & state
│   │   ├── employee-form.tsx         # Add/edit employee (profile or manual)
│   │   ├── employee-list.tsx         # Employee card list
│   │   ├── tasks-container.tsx       # Kanban board with D&D
│   │   ├── task-form.tsx             # Add/edit task form
│   │   ├── sidebar.tsx               # Navigation sidebar
│   │   ├── task-status-chart.tsx     # Recharts donut chart
│   │   └── permissions-context.tsx   # Client-side permissions provider
│   ├── ui/
│   │   ├── task-detail-modal.tsx     # Task detail popup
│   │   ├── employee-detail-modal.tsx # Employee detail popup
│   │   ├── delete-modal.tsx          # Reusable confirmation modal
│   │   ├── skeleton.tsx              # Loading skeletons
│   │   └── button.tsx, card.tsx...   # shadcn/ui components
│   └── auth/
│       └── auth-navbar.tsx           # Auth pages navbar
│
├── lib/
│   ├── actions/
│   │   └── data-actions.ts           # All CRUD server actions
│   ├── auth.ts                       # JWT + bcrypt auth helpers
│   ├── auth-middleware.ts            # Edge-compatible auth middleware
│   ├── email.ts                      # Nodemailer email templates
│   ├── permissions.ts                # 22 permissions, 3 default roles
│   ├── supabase.ts                   # Supabase client singleton
│   ├── types.ts                      # TypeScript type definitions
│   └── utils/
│       └── async-helpers.ts          # createSuccess/createError helpers
│
├── supabase/
│   └── schema.sql                    # Full database schema
├── middleware.ts                      # Route protection middleware
├── .env.example                      # Environment variables template
├── package.json
└── README.md
```

---

## الميزات الرئيسية (Key Features)

### 1. لوحة التحكم (Dashboard)
- **إحصائيات عامة**: عدد الموظفين، الأقسام، المهام، ومعدل الإنجاز
- **رسم بياني**: مخطط دائري لتوزيع المهام حسب الحالة (To Do, In Progress, Review, Completed)
- **أحدث المهام**: قائمة بأحدث 5 مهام مع الأولوية والحالة

### 2. إدارة الموظفين (Employee Management)
- **إضافة موظف**: عن طريق اختيار ملف شخصي موجود أو إدخال بيانات يدوياً
- **تعديل بيانات الموظف**: الموقع، الراتب، الحالة، القسم، المدير
- **حذف موظف**: مع تأكيد قبل الحذف
- **عرض البيانات**: صفحة تفاصيل لكل موظف مع جميع المهام المسندة إليه
- **البحث والفلترة**: بالاسم أو البريد الإلكتروني أو القسم
- **تقسيم النتائج إلى صفحات**: 10 عناصر لكل صفحة

### 3. إدارة الأقسام (Department Management)
- **إضافة قسم**: مع تحديد المدير
- **تعديل بيانات القسم**: الاسم والمدير
- **حذف قسم**: مع تأكيد

### 4. إدارة المهام (Task Management)
- **لوحة كانبان**: عرض المهام كبطاقات مقسمة بأعمدة الحالة
- **سحب وإفلات**: تغيير حالة المهام بالسحب
- **إضافة مهمة**: العنوان، الوصف، الأولوية، الحالة، القسم، المسؤول، تاريخ التسليم
- **تعديل مهمة**: تغيير أي بيانات مع إرسال إشعارات
- **حذف مهمة**: مع إشعار المعنيين
- **فلترة**: حسب القسم، "مسندة إليّ"، "أنشأتها أنا"

### 5. نظام الإشعارات (Notification System)
- عند تعيين مهمة → إشعار للموظف
- عند تغيير حالة المهمة → إشعار للمنشئ والمسؤول
- عند تعديل المهمة → إشعار للطرف الآخر
- عند حذف المهمة → إشعار للمنشئ والمسؤول
- عند إضافة موظف → إشعار للموظف
- عند دعوة عضو → إشعار + بريد إلكتروني

### 6. نظام الصلاحيات (Permission System)
- **22 صلاحية** عبر 8 مجموعات
- **3 أدوار افتراضية**: Admin (كاملة), Manager (جزئية), Employee (عرض فقط)
- **أدوار مخصصة**: يمكن إنشاء أدوار بصلاحيات مخصصة

### 7. نظام الدعوات (Invitation System)
- دعوة أعضاء عبر البريد الإلكتروني
- بريد إلكتروني تلقائي عند الدعوة
- قبول أو رفض الدعوة من صفحة الإشعارات
- إنشاء حساب جديد للأشخاص غير المسجلين

---

## قاعدة البيانات (Database Schema)

| الجدول | الوصف |
|--------|-------|
| `Team` | الفرق (اسم، مالك) |
| `users` | حسابات المستخدمين (بريد، كلمة مرور) |
| `profiles` | الملفات الشخصية (اسم، بريد، دور، فريق) |
| `team_members` | عضوية الفريق |
| `departments` | الأقسام (اسم، مدير، فريق) |
| `employees` | الموظفين (قسم، موقع، راتب، حالة) |
| `tasks` | المهام (عنوان، وصف، أولوية، حالة، مسؤول، تاريخ) |
| `invitations` | الدعوات (بريد، دور، حالة) |
| `notifications` | الإشعارات (نوع، عنوان، رسالة، مقروء) |
| `roles` | الأدوار المخصصة (اسم، صلاحيات) |

---

## License

MIT License
