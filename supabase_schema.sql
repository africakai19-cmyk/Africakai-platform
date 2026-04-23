-- ─────────────────────────────────────────────────────────────────────────────
-- AfricaKai Platform — Supabase Database Schema v1.0
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── DIVISIONS ────────────────────────────────────────────────────────────────
CREATE TABLE divisions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,         -- 'main', 'bizcom', 'consulting', etc.
  name        TEXT NOT NULL,
  legal_name  TEXT,
  reg_number  TEXT,
  active      BOOLEAN DEFAULT false,
  color       TEXT DEFAULT '#E8700A',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO divisions (code, name, legal_name, active, color) VALUES
  ('main',       'AfricaKai (Pty) Ltd',                    'AfricaKai (Pty) Ltd',                    true,  '#E8700A'),
  ('bizcom',     'AfricaKai Business Compliance',          'AfricaKai Business Compliance (Pty) Ltd', true,  '#3B82F6'),
  ('consulting', 'AfricaKai Management Consulting',        'AfricaKai Management Consulting',         true,  '#10B981'),
  ('financial',  'AfricaKai Financial Services',           'AfricaKai Financial Services (Pty) Ltd',  false, '#8B5CF6'),
  ('properties', 'AfricaKai Properties & Investments',     'AfricaKai Properties & Investments',      false, '#F59E0B'),
  ('banking',    'AfricaKai Banking',                      'AfricaKai Banking Institution',           false, '#EF4444');

-- ─── DEPARTMENTS ──────────────────────────────────────────────────────────────
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  division_id UUID REFERENCES divisions(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO departments (code, name, division_id) VALUES
  ('finance',    'Finance',                  (SELECT id FROM divisions WHERE code = 'main')),
  ('admin',      'Admin / Operations',       (SELECT id FROM divisions WHERE code = 'main')),
  ('hr',         'Human Resources',          (SELECT id FROM divisions WHERE code = 'main')),
  ('marketing',  'Marketing & Sales',        (SELECT id FROM divisions WHERE code = 'main')),
  ('it',         'Information Technology',   (SELECT id FROM divisions WHERE code = 'main')),
  ('risk',       'Risk & Compliance',        (SELECT id FROM divisions WHERE code = 'main'));

-- ─── BRANCHES ─────────────────────────────────────────────────────────────────
CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  province    TEXT NOT NULL,
  address     TEXT,
  is_hq       BOOLEAN DEFAULT false,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO branches (name, city, province, is_hq, active) VALUES
  ('Head Office', 'Polokwane', 'Limpopo', true, true);

-- ─── EMPLOYEES ────────────────────────────────────────────────────────────────
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_number TEXT UNIQUE,              -- Auto-generated: AK-2025-0001
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  id_number       TEXT,
  email           TEXT UNIQUE NOT NULL,     -- @africakai.co.za
  phone           TEXT,
  role            TEXT NOT NULL,            -- maps to ROLES constants
  role_label      TEXT,
  division_id     UUID REFERENCES divisions(id),
  department_id   UUID REFERENCES departments(id),
  branch_id       UUID REFERENCES branches(id),
  reports_to      UUID REFERENCES employees(id),
  employment_type TEXT DEFAULT 'fulltime',  -- fulltime, parttime, intern, contractor
  start_date      DATE,
  end_date        DATE,
  status          TEXT DEFAULT 'active',    -- active, inactive, suspended, terminated
  profile_photo   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate employee number function
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num   INT;
  new_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COUNT(*) + 1 INTO seq_num FROM employees
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  new_number := 'AK-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  NEW.employee_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_employee_number
  BEFORE INSERT ON employees
  FOR EACH ROW
  WHEN (NEW.employee_number IS NULL)
  EXECUTE FUNCTION generate_employee_number();

-- ─── ORANGE ARMY ──────────────────────────────────────────────────────────────
CREATE TABLE orange_army (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  member_number   TEXT UNIQUE,              -- OA-2025-0001
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  id_number       TEXT,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  qualifications  TEXT[],
  specializations TEXT[],                   -- 'cipc', 'vat', 'paye', 'bookkeeping', etc.
  bank_name       TEXT,
  bank_account    TEXT,
  bank_branch     TEXT,
  status          TEXT DEFAULT 'active',    -- active, inactive, suspended
  rating          DECIMAL(3,2) DEFAULT 5.0,
  total_earnings  DECIMAL(12,2) DEFAULT 0,
  joined_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLIENTS ──────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  client_number   TEXT UNIQUE,              -- AKC-2025-0001
  company_name    TEXT NOT NULL,
  trading_as      TEXT,
  reg_number      TEXT,
  vat_number      TEXT,
  entity_type     TEXT,                     -- pty_ltd, cc, sole_prop, npo, etc.
  industry        TEXT,
  contact_first   TEXT,
  contact_last    TEXT,
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT,
  address         TEXT,
  city            TEXT,
  province        TEXT,
  division_id     UUID REFERENCES divisions(id),
  assigned_admin  UUID REFERENCES employees(id),
  status          TEXT DEFAULT 'active',    -- active, inactive, prospect
  lead_source     TEXT,                     -- google, referral, website, walk_in
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto client number
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num   INT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  SELECT COUNT(*) + 1 INTO seq_num FROM clients
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  NEW.client_number := 'AKC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_client_number
  BEFORE INSERT ON clients
  FOR EACH ROW
  WHEN (NEW.client_number IS NULL)
  EXECUTE FUNCTION generate_client_number();

-- ─── SERVICES ─────────────────────────────────────────────────────────────────
CREATE TABLE services (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  division_id   UUID REFERENCES divisions(id),
  base_price    DECIMAL(10,2),
  requires_deposit BOOLEAN DEFAULT true,
  deposit_percent  INT DEFAULT 50,
  oa_eligible   BOOLEAN DEFAULT true,       -- can Orange Army do this?
  oa_percent    INT DEFAULT 40,             -- Orange Army share %
  active        BOOLEAN DEFAULT true
);

-- ─── WORK ORDERS ──────────────────────────────────────────────────────────────
CREATE TABLE work_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    TEXT UNIQUE,              -- WO-2025-0001
  client_id       UUID REFERENCES clients(id),
  service_id      UUID REFERENCES services(id),
  assigned_to     UUID REFERENCES employees(id),
  orange_army_id  UUID REFERENCES orange_army(id),
  created_by      UUID REFERENCES employees(id),
  status          TEXT DEFAULT 'pending',   -- pending, in_progress, review, completed, cancelled
  priority        TEXT DEFAULT 'normal',    -- low, normal, high, urgent
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  oa_amount       DECIMAL(10,2),            -- 40% of invoice
  oa_paid         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVOICES ─────────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT UNIQUE,              -- INV-2025-0001
  client_id       UUID REFERENCES clients(id),
  work_order_id   UUID REFERENCES work_orders(id),
  division_id     UUID REFERENCES divisions(id),
  amount          DECIMAL(10,2) NOT NULL,
  vat_amount      DECIMAL(10,2) DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL,
  type            TEXT DEFAULT 'invoice',   -- quote, deposit, invoice, credit_note
  status          TEXT DEFAULT 'draft',     -- draft, sent, partial, paid, overdue, cancelled
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES employees(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMPLIANCE CALENDAR ──────────────────────────────────────────────────────
CREATE TABLE compliance_deadlines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES clients(id),
  deadline_type   TEXT NOT NULL,            -- annual_return, vat_return, paye, uif, coida, etc.
  description     TEXT,
  due_date        DATE NOT NULL,
  status          TEXT DEFAULT 'upcoming',  -- upcoming, reminded, actioned, completed, missed
  reminded_at     TIMESTAMPTZ,
  actioned_at     TIMESTAMPTZ,
  assigned_to     UUID REFERENCES employees(id),
  work_order_id   UUID REFERENCES work_orders(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RISK FLAGS ───────────────────────────────────────────────────────────────
CREATE TABLE risk_flags (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_type       TEXT NOT NULL,            -- client_file, deadline, invoice, staff, oa_conduct
  priority        TEXT DEFAULT 'medium',    -- low, medium, high, critical
  title           TEXT NOT NULL,
  description     TEXT,
  raised_by       UUID REFERENCES employees(id),
  assigned_to     UUID REFERENCES employees(id),
  client_id       UUID REFERENCES clients(id),
  employee_id     UUID REFERENCES employees(id),
  oa_member_id    UUID REFERENCES orange_army(id),
  status          TEXT DEFAULT 'open',      -- open, investigating, resolved, dismissed
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COMMUNICATIONS ───────────────────────────────────────────────────────────
CREATE TABLE communications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            TEXT NOT NULL,            -- internal_message, client_email, client_sms, flag
  subject         TEXT,
  body            TEXT NOT NULL,
  from_employee   UUID REFERENCES employees(id),
  to_client       UUID REFERENCES clients(id),
  to_employee     UUID REFERENCES employees(id),
  client_id       UUID REFERENCES clients(id),
  sent_via        TEXT DEFAULT 'platform',  -- platform, email, sms
  department_email TEXT,                    -- which dept email it was sent from
  status          TEXT DEFAULT 'sent',
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  read_at         TIMESTAMPTZ
);

-- ─── DOCUMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  file_path       TEXT NOT NULL,            -- Supabase Storage path
  file_type       TEXT,
  file_size       INT,
  category        TEXT,                     -- id_document, contract, certificate, invoice, etc.
  client_id       UUID REFERENCES clients(id),
  employee_id     UUID REFERENCES employees(id),
  work_order_id   UUID REFERENCES work_orders(id),
  uploaded_by     UUID REFERENCES employees(id),
  requires_signature BOOLEAN DEFAULT false,
  signed          BOOLEAN DEFAULT false,
  signed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HR — LEAVE ───────────────────────────────────────────────────────────────
CREATE TABLE leave_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID REFERENCES employees(id),
  leave_type      TEXT NOT NULL,            -- annual, sick, family, unpaid
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  days_requested  INT,
  reason          TEXT,
  status          TEXT DEFAULT 'pending',   -- pending, approved, declined
  approved_by     UUID REFERENCES employees(id),
  decided_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEADS ────────────────────────────────────────────────────────────────────
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name    TEXT,
  contact_name    TEXT,
  email           TEXT,
  phone           TEXT,
  source          TEXT,                     -- google, website, referral, walk_in, social
  service_interest TEXT,
  status          TEXT DEFAULT 'new',       -- new, contacted, qualified, converted, lost
  assigned_to     UUID REFERENCES employees(id),
  converted_to    UUID REFERENCES clients(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SILVER BULLET INTERNSHIPS ────────────────────────────────────────────────
CREATE TABLE internship_placements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name    TEXT NOT NULL,
  id_number       TEXT,
  email           TEXT,
  phone           TEXT,
  qualification   TEXT NOT NULL,            -- NCV Business Admin, N4 Business Management, etc.
  nqf_level       INT,
  institution     TEXT NOT NULL,
  host_company    UUID REFERENCES clients(id),
  funder          TEXT,
  start_date      DATE,
  end_date        DATE,
  status          TEXT DEFAULT 'placed',    -- placed, active, completed, withdrawn
  logbook_status  TEXT DEFAULT 'pending',   -- pending, in_progress, submitted, approved
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIT LOG ────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES employees(id),
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MONTHLY REPORTS ──────────────────────────────────────────────────────────
CREATE TABLE monthly_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id   UUID REFERENCES departments(id),
  division_id     UUID REFERENCES divisions(id),
  report_month    DATE NOT NULL,            -- first of the month
  due_date        DATE NOT NULL,
  submitted_at    TIMESTAMPTZ,
  submitted_by    UUID REFERENCES employees(id),
  status          TEXT DEFAULT 'pending',   -- pending, submitted, reviewed
  content         JSONB,
  reviewed_by     UUID REFERENCES employees(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE employees           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_flags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orange_army         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;

-- CEO sees everything
CREATE POLICY "CEO full access" ON employees FOR ALL USING (
  EXISTS (SELECT 1 FROM employees WHERE auth_user_id = auth.uid() AND role = 'ceo')
);

-- Employees can see their own record
CREATE POLICY "Employees see own record" ON employees FOR SELECT USING (
  auth_user_id = auth.uid()
);

-- ─── HELPFUL VIEWS ────────────────────────────────────────────────────────────

-- Active clients with their compliance status
CREATE VIEW v_client_compliance AS
  SELECT
    c.id, c.client_number, c.company_name,
    c.status, c.division_id,
    COUNT(cd.id) FILTER (WHERE cd.status = 'upcoming') AS upcoming_deadlines,
    COUNT(cd.id) FILTER (WHERE cd.status = 'missed')   AS missed_deadlines,
    COUNT(wo.id) FILTER (WHERE wo.status = 'in_progress') AS active_work_orders
  FROM clients c
  LEFT JOIN compliance_deadlines cd ON cd.client_id = c.id
  LEFT JOIN work_orders wo ON wo.client_id = c.id
  GROUP BY c.id;

-- CEO dashboard summary
CREATE VIEW v_ceo_dashboard AS
  SELECT
    (SELECT COUNT(*) FROM clients WHERE status = 'active')          AS active_clients,
    (SELECT COUNT(*) FROM employees WHERE status = 'active')        AS active_employees,
    (SELECT COUNT(*) FROM orange_army WHERE status = 'active')      AS active_oa_members,
    (SELECT COUNT(*) FROM risk_flags WHERE status = 'open')         AS open_risk_flags,
    (SELECT COUNT(*) FROM invoices WHERE status = 'overdue')        AS overdue_invoices,
    (SELECT COUNT(*) FROM work_orders WHERE status = 'in_progress') AS active_work_orders,
    (SELECT COALESCE(SUM(total), 0) FROM invoices
      WHERE status = 'paid' AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW())
    ) AS revenue_this_month;
