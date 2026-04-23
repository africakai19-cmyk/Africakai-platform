# AfricaKai Business Management Platform

> *Africa's Gift to the World Starts Here.*

A fully integrated, AI-powered business operating system for AfricaKai (Pty) Ltd and all its divisions.

---

## Tech Stack (Zero Cost to Start)

| Layer | Technology | Cost |
|---|---|---|
| Frontend Web | React + Vite | Free |
| Mobile | Expo (React Native) | Free |
| Hosting | Vercel | Free |
| Database | Supabase (PostgreSQL) | Free tier |
| Auth | Supabase Auth | Free tier |
| File Storage | Supabase Storage | Free tier |
| Real-time | Supabase Realtime | Free tier |
| AI Assistant | Anthropic Claude API | Usage-based |
| Email | Resend | Free tier |
| Code | GitHub | Free |

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/africakai/platform.git
cd africakai-platform
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project — name it `africakai-platform`
3. Go to **SQL Editor** and run the contents of `supabase_schema.sql`
4. Go to **Settings → API** and copy your Project URL and anon key

### 3. Configure Environment

```bash
cp .env.example .env.local
# Fill in your Supabase URL and anon key
```

### 4. Run Locally

```bash
npm run dev
# Opens at http://localhost:5173
```

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Settings → Environment Variables → add all from .env.example
```

---

## Platform Structure

```
africakai-platform/
├── src/
│   ├── components/
│   │   ├── auth/          # Login, protected routes
│   │   ├── dashboard/     # Dashboard components
│   │   └── shared/        # Sidebar, layout, common UI
│   ├── pages/             # Page-level components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Supabase client, roles, utilities
│   ├── store/             # Zustand state management
│   └── styles/            # Global CSS
├── supabase_schema.sql    # Full database schema
├── .env.example           # Environment variables template
└── README.md
```

---

## Role-Based Access

Every employee logs in and sees only what their role permits:

| Role | Access Level |
|---|---|
| CEO | Everything — all divisions, all departments, all reports |
| COO | All departments, all branches, consolidated reporting |
| CFO | All financial data across all divisions |
| HOD (any dept) | Their department + relevant cross-divisional data |
| Division MD | Their division's clients, team, and work orders |
| Compliance Agent | Assigned client files and work orders only |
| Orange Army | Assigned work only — no client contact |
| Client | Their own services, documents, invoices |

---

## Modules (Build Phases)

### Phase 1 — Foundation ✅ (Current)
- [x] Authentication & role-based access
- [x] CEO Dashboard with live stats
- [x] Sidebar navigation per role
- [x] Database schema (all tables)
- [ ] Employee onboarding & auto-numbering
- [ ] Client management

### Phase 2 — Operations
- [ ] Finance module (invoicing, quotes, OA payouts)
- [ ] Admin/Operations (client communication, deadline tracking)
- [ ] HR module (contracts, leave, disciplinary)
- [ ] Work order management
- [ ] Document management with digital signatures

### Phase 3 — Intelligence
- [ ] Marketing & Sales (lead generation, CRM pipeline)
- [ ] Risk & Compliance audit system
- [ ] AI Assistant (Claude) — embedded per role
- [ ] Automated email system (department-based)
- [ ] Monthly report automation

### Phase 4 — Scale
- [ ] Orange Army portal
- [ ] Client portal
- [ ] Silver Bullet internship management
- [ ] Branch management
- [ ] Mobile app (Expo)
- [ ] Advanced analytics

---

## Email Setup (Free)

### Zoho Mail — Professional Inboxes (Free up to 5 users)
1. Go to [zoho.com/mail](https://zoho.com/mail)
2. Sign up → Add your domain `africakai.co.za`
3. Verify domain ownership in your domain registrar's DNS settings
4. Create mailboxes: `finance@`, `admin@`, `hr@`, `bizcom@`, `ceo@`

### Cloudflare Email Routing — Unlimited Forwarding (Free)
1. Add your domain to [Cloudflare](https://cloudflare.com)
2. Enable Email Routing
3. Create forwarding rules for unlimited `@africakai.co.za` addresses

---

## AfricaKai Corporate Structure

```
AfricaKai (Pty) Ltd — Main Holding Entity
│
├── Shared Departments (serve all divisions)
│   ├── Finance
│   ├── Admin / Operations
│   ├── Human Resources
│   ├── Marketing & Sales
│   ├── Information Technology
│   └── Risk & Compliance
│
├── AfricaKai Business Compliance (Active)
├── AfricaKai Management Consulting (Active)
├── AfricaKai Financial Services (Planned)
├── AfricaKai Properties & Investments (Planned)
└── AfricaKai Banking (Long-term Vision)
```

---

*Built for AfricaKai (Pty) Ltd — Reg No: 2019/380527/07*  
*Polokwane, Limpopo — Solving African Problems*
