# matriXO Website

> ⚠️ **PROPRIETARY SOFTWARE - ALL RIGHTS RESERVED** ⚠️

A modern, responsive event ticketing and ed-tech platform for **matriXO** - An Ed-Tech Startup.

🌐 **Live**: [matrixo.in](https://matrixo.in)  
🧪 **Beta**: [beta.matrixo.in](https://beta.matrixo.in)  
👥 **Employee Portal**: [team-auth.matrixo.in](https://team-auth.matrixo.in)

---

## ⚖️ LEGAL NOTICE & COPYRIGHT WARNING

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  🚨 THIS IS PROPRIETARY SOFTWARE - UNAUTHORIZED USE IS STRICTLY PROHIBITED   ║
║                                                                              ║
║   Copyright © 2024-2026 matriXO. ALL RIGHTS RESERVED.                        ║
║                                                                              ║
║   This repository and ALL its contents including but not limited to:         ║
║   • Source code, algorithms, and logic                                       ║
║   • UI/UX designs, layouts, and styling                                      ║
║   • Business logic and proprietary implementations                           ║
║   • Database schemas and data structures                                     ║
║   • API designs and integrations                                             ║
║   • Employee portal systems and workflows                                    ║
║   • All assets, images, logos, and branding                                  ║
║                                                                              ║
║   Are the EXCLUSIVE INTELLECTUAL PROPERTY of matriXO.                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 🚫 PROHIBITED ACTIONS

The following actions are **STRICTLY PROHIBITED** without explicit written authorization:

| ❌ Action | ⚖️ Consequence |
|-----------|----------------|
| Copying source code | Legal action under Copyright Act |
| Cloning this repository | DMCA takedown + Legal proceedings |
| Using code in personal/commercial projects | Civil lawsuit for damages |
| Redistributing any part of the codebase | Criminal prosecution |
| Creating derivative works | Intellectual property infringement |
| Selling or licensing this code | Fraud + Copyright violation |
| Using designs/UI in other projects | Design theft prosecution |
| Scraping or extracting data | Computer fraud charges |

### 🔒 MONITORING & ENFORCEMENT

- **All repository activities are logged and monitored**
- **IP addresses and user information are tracked**
- **Automated plagiarism detection is active**
- **Legal team is on standby for DMCA takedowns**

### ⚠️ LEGAL CONSEQUENCES

Any unauthorized use, reproduction, or distribution of this software will result in:

1. **Immediate DMCA Takedown** - Your repository/project will be removed
2. **Legal Action** - Civil lawsuit seeking damages up to ₹50,00,000 (INR) / $60,000 (USD)
3. **Criminal Prosecution** - Under IT Act 2000 (India) and DMCA (USA)
4. **Public Disclosure** - Offenders may be publicly named
5. **Professional Consequences** - Report to employers/institutions

### 📜 APPLICABLE LAWS

This software is protected under:
- **Indian Copyright Act, 1957** (Sections 51, 63)
- **Information Technology Act, 2000** (India)
- **Digital Millennium Copyright Act (DMCA)** (USA)
- **Berne Convention for the Protection of Literary and Artistic Works**
- **TRIPS Agreement** (WTO)

---

> 💡 **If you're interested in our technology or want to collaborate, contact us legally at hello@matrixo.in**

---

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

- Partners: TEDxKPRIT, TEDxIARE, TEDxCMRIT, Smartzy Edu
- Built with ❤️ using modern web technologies

## License

```
╔════════════════════════════════════════════════════════════════════════════╗
║                        PROPRIETARY LICENSE                                 ║
║                                                                            ║
║  Copyright © 2024-2026 matriXO. ALL RIGHTS RESERVED.                       ║
║                                                                            ║
║  This software is proprietary and confidential. Unauthorized copying,      ║
║  modification, distribution, or use of this software, via any medium,      ║
║  is strictly prohibited without the prior written consent of matriXO.      ║
║                                                                            ║
║  This is NOT open source software. This is NOT free software.              ║
║  No license is granted to use, copy, modify, or distribute this code.      ║
║                                                                            ║
║  Violations will be prosecuted to the fullest extent of the law.           ║
║                                                                            ║
║  Legal Contact: legal@matrixo.in                                           ║
║  General Contact: hello@matrixo.in                                         ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### Ownership Declaration

- **Owner**: matriXO
- **Jurisdiction**: India
- **Original Authors**: Shiva Ganesh T & matriXO Development Team
- **Registration**: All original works are timestamped and documented

### Why This Repository is Public

This repository is publicly visible due to platform migration constraints. **Public visibility does NOT grant any usage rights.** The code remains fully proprietary and protected under international copyright law.

> ⚠️ **DO NOT assume public = free to use. IT IS NOT.**

---

**Last Updated**: January 26, 2026

---

<p align="center">
  <strong>🔐 Protected by matriXO Legal Team 🔐</strong><br>
  <em>We actively monitor and pursue copyright violations</em>
</p>

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

## AI Coding Agent Support

This project includes `.github/copilot-instructions.md` to help AI coding agents (GitHub Copilot, Cursor, etc.) be immediately productive:

- **Architecture Overview**: Multi-domain setup (production, beta, employee portal)
- **Project Structure**: Page, component, API route, and data patterns
- **Critical Conventions**: Client components, Tailwind design tokens, event data structure
- **Beta Feature Gating**: How features are conditionally enabled via `lib/config.ts`
- **Integration Points**: Firebase Auth, Firestore, Resend email, Razorpay payments
- **Key Files Reference**: Links to middleware, config, and complex components

---

<p align="center">
  <strong>© 2024-2026 matriXO. ALL RIGHTS RESERVED.</strong><br>
  <em>Unauthorized use is prohibited and will be prosecuted.</em><br><br>
  <strong>Last Updated: February 3, 2026</strong>
</p>
