# matriXO Website

A modern, responsive event ticketing and ed-tech platform for **matriXO** - An Ed-Tech Startup supported by KPRISE (KPR Foundation for Innovation and Social Empowerment).

🌐 **Live**: [matrixo.in](https://matrixo.in)  
🧪 **Beta**: [beta.matrixo.in](https://beta.matrixo.in)  
👥 **Employee Portal**: [team-auth.matrixo.in](https://team-auth.matrixo.in)

## Features

- 🎨 **Modern Design**: Clean, professional UI with blue-focused color scheme and dark mode support
- ⚡ **Fast Performance**: Built with Next.js 14.2 for optimal performance
- 🎯 **Event Management**: Complete event listing, detail pages, and ticketing flow
- 📱 **Mobile-First**: Fully responsive design across all devices
- 🎭 **Smooth Animations**: Framer Motion powered animations throughout
- 🎫 **Ticketing System**: Dynamic pricing, early bird offers, Razorpay integration ready
- 🔐 **Authentication**: Firebase Auth with Google, GitHub, and email sign-in
- 👥 **Employee Portal**: Comprehensive internal management system with attendance, tasks, discussions, and calendar
- 🔔 **Real-time Notifications**: Push notifications and in-app notification system
- 📊 **Analytics Ready**: SEO optimized with Open Graph tags
- 🔒 **Type-Safe**: Built with TypeScript for reliability
- 📧 **Contact Form**: Integrated email notifications via Resend

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14.2.35 (App Router) |
| **Language** | TypeScript 5.3 |
| **Styling** | Tailwind CSS 3.4 |
| **Animations** | Framer Motion 10 |
| **Authentication** | Firebase Auth |
| **Database** | Firebase Firestore |
| **Icons** | React Icons |
| **Forms** | React Hook Form |
| **Notifications** | Sonner |
| **Email** | Resend |
| **Date Handling** | date-fns |
| **QR Codes** | qrcode.react |

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase project (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/shivaganesht/matrixo-website-deployment.git
cd matrixo-website-deployment
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (create `.env.local`):
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://matrixo.in
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
matriXO Website/
├── app/                          # Next.js App Router pages
│   ├── about/                   # About page
│   ├── api/                     # API routes
│   │   ├── contact/            # Contact form API
│   │   ├── register/           # Event registration API
│   │   └── tickets/            # Tickets API
│   ├── auth/                    # Authentication page
│   ├── blog/                    # Blog page
│   ├── contact/                 # Contact page
│   ├── employee-portal/         # Internal employee attendance system
│   ├── events/                  # Events pages
│   │   └── [slug]/             # Dynamic event detail pages
│   ├── privacy/                 # Privacy policy
│   ├── refund/                  # Refund policy
│   ├── services/                # Services page
│   ├── shipping/                # Shipping policy
│   ├── team/                    # Team page
│   ├── terms/                   # Terms of service
│   ├── globals.css              # Global styles & design system
│   ├── layout.tsx               # Root layout
│   ├── not-found.tsx            # 404 page
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── about/                   # About page components
│   ├── contact/                 # Contact page components
│   ├── employee-portal/         # Employee portal components
│   │   ├── AdminPanel.tsx      # Admin management panel
│   │   ├── Attendance.tsx      # Attendance tracking
│   │   ├── Calendar.tsx        # Holiday & event calendar
│   │   ├── Discussions.tsx     # Team discussions
│   │   ├── NotificationBell.tsx # Notification popover
│   │   ├── Tasks.tsx           # Task management
│   │   └── ui/                 # Shared UI components
│   │       └── index.tsx       # Card, Button, Modal, Select, ProfileInfo, etc.
│   ├── events/                  # Event components
│   │   ├── EventDetail.tsx     # Event detail page
│   │   ├── EventRegistrationForm.tsx
│   │   └── EventsListing.tsx   # Events listing
│   ├── home/                    # Home page components
│   │   ├── Hero.tsx            # Hero section
│   │   ├── Features.tsx        # Features section
│   │   ├── About.tsx           # About snippet
│   │   ├── Stats.tsx           # Statistics
│   │   ├── Partners.tsx        # Partner logos
│   │   └── CTA.tsx             # Call-to-action
│   ├── services/                # Services components
│   ├── team/                    # Team components
│   ├── Footer.tsx               # Footer component
│   ├── Navbar.tsx               # Navigation component
│   └── Confetti.tsx             # Celebration animation
├── data/                         # Static data files
│   └── events.json              # Event data
├── lib/                          # Utility libraries
│   ├── AuthContext.tsx          # User authentication context
│   ├── employeePortalContext.tsx # Employee portal auth & data context
│   ├── notificationContext.tsx  # Real-time notification system
│   ├── firebaseConfig.ts        # Firebase configuration
│   └── config.ts                # App configuration
├── public/                       # Static assets
│   ├── events/                  # Event images
│   ├── logos/                   # Brand logos
│   └── team/                    # Team photos
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Key Pages

### Home (`/`)
- Hero section with brand messaging
- Statistics showcase (25+ events, 5000+ participants, etc.)
- About snippet
- Key features grid
- Partner logos carousel
- Call-to-action sections

### Events (`/events`)
- Filterable event listing
- Search functionality
- Event cards with ticket availability
- Category filtering

### Event Detail (`/events/[slug]`)
- Full event information
- Agenda and schedule
- Speaker profiles with social links
- Ticket purchasing flow
- Interactive booking modal
- Special TEDx event theming support

### Auth (`/auth`)
- Sign in / Sign up toggle
- Google OAuth
- GitHub OAuth
- Email/password authentication
- Password reset

### Employee Portal (`/employee-portal`)
- **Authentication**: Secure employee login with Firebase Auth
- **Dashboard**: Personal overview with attendance stats, quick actions, and personal todo list
- **Attendance Tracking**: 
  - Check-in/check-out with timestamps
  - Status options: Present, On Duty, Leave, Half Day
  - Attendance percentage calculation
  - Auto-absent job for missed attendance
- **Calendar**:
  - Holiday management (public, company, optional)
  - Working day overrides for weekends
  - Calendar events with color coding
  - List and month views
- **Tasks**:
  - Task assignment and tracking
  - Priority levels (low, medium, high, urgent)
  - Status management (pending, in-progress, completed)
  - Due date tracking
- **Discussions**:
  - Team discussion board
  - @mention users with hover profile cards
  - #mention departments
  - Reply threads and pinning
- **Admin Panel** (admin only):
  - Employee management
  - Attendance overview for all employees
  - Holiday and event management
  - Leave request approvals
- **Notifications**:
  - Real-time push notifications
  - In-app notification bell with popover
  - Mark as read/unread functionality

### Policy Pages
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `/refund` - Cancellation & Refund Policy
- `/shipping` - Shipping & Delivery Policy

## Deployment

### Branch Strategy

| Branch | Domain | Purpose |
|--------|--------|---------|
| `main` | matrixo.in | Production |
| `beta` | beta.matrixo.in | Beta testing / Preview |

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Set up domain mappings:
   - `main` → matrixo.in (Production)
   - `beta` → beta.matrixo.in (Preview)

### Manual Build

```bash
npm run build
npm start
```

## Design System

### Colors (Blue-focused)
- **Primary**: `blue-600` (#2563EB)
- **Primary Dark**: `blue-700` (#1D4ED8)
- **Background Light**: `white`
- **Background Dark**: `gray-950`
- **Text**: `gray-900` / `gray-100`
- **Borders**: `gray-200` / `gray-800`

### Components
- Buttons: `rounded-xl`, solid blue backgrounds
- Cards: Clean borders, subtle shadows
- Inputs: `rounded-xl`, blue focus rings
- Icons: Consistent blue coloring

## SEO Features

- Dynamic meta tags per page
- Open Graph tags for social sharing
- Twitter cards
- Structured data for events
- Auto-generated sitemap (`/sitemap.xml`)
- robots.txt configuration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contact & Support

- **Email**: hello@matrixo.in
- **Website**: [matrixo.in](https://matrixo.in)

## Acknowledgments

- Supported by **KPRISE** (KPR Foundation for Innovation and Social Empowerment)
- Partners: TEDxKPRIT, TEDxIARE, TEDxCMRIT, Smartzy Edu
- Built with ❤️ using modern web technologies

## License

© 2025-2026 matriXO. All rights reserved.

---

## Employee Portal Architecture

The Employee Portal is a comprehensive internal management system built with React Context and Firebase Firestore.

### Core Components

| Component | Purpose |
|-----------|---------|
| `Attendance.tsx` | Check-in/out, status tracking, history |
| `Calendar.tsx` | Holidays, events, working day overrides |
| `Tasks.tsx` | Task management with priorities |
| `Discussions.tsx` | Team discussions with @mentions |
| `AdminPanel.tsx` | Employee & attendance management |
| `NotificationBell.tsx` | Real-time notification popover |
| `ui/index.tsx` | Shared UI components (Card, Button, Modal, Select, ProfileInfo, etc.) |

### Firestore Collections

| Collection | Purpose |
|------------|---------|
| `employees` | Employee profiles and credentials |
| `attendance` | Daily attendance records |
| `holidays` | Company and public holidays |
| `calendarEvents` | Calendar events |
| `tasks` | Assigned tasks |
| `discussions` | Discussion posts |
| `discussionReplies` | Reply threads |
| `notifications` | User notifications |
| `leaveRequests` | Leave applications |
| `personalTodos` | Personal todo items |

### Key Features

- **Portal-based Popovers**: All dropdowns and popovers use React Portals to escape parent stacking contexts
- **Real-time Updates**: Firebase `onSnapshot` listeners for live data sync
- **Working Day Overrides**: Weekends can be marked as working days for special requirements
- **@Mention System**: Tag employees in discussions with hover profile cards
- **Auto-Absent Job**: Automatically marks employees as absent if no attendance by end of day

---

**Last Updated**: January 26, 2026
