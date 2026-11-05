import { mkdir, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import dotenv from '../backend/node_modules/dotenv/lib/main.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, 'backend', '.env'), quiet: true });

const email = process.env.SEED_HOSPITAL_ADMIN_EMAIL;
const password = process.env.SEED_HOSPITAL_ADMIN_PASSWORD;
if (!email || !password) {
  throw new Error('Seed administrator credentials are not configured in backend/.env.');
}

const baseUrl = 'http://127.0.0.1:4200';
const outputDirectory = path.join(root, 'demo-output');
const recordingDirectory = path.join(outputDirectory, '.recording');
const outputPath = path.join(outputDirectory, 'medicare-complete-feature-demo.webm');
await mkdir(recordingDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: recordingDirectory, size: { width: 1440, height: 900 } },
  locale: 'en-IN',
  colorScheme: 'light',
});
const page = await context.newPage();
const video = page.video();

const wait = (milliseconds) => page.waitForTimeout(milliseconds);

async function removeOverlay() {
  await page
    .evaluate(() => document.querySelector('[data-demo-overlay]')?.remove())
    .catch(() => {});
}

async function showOverlay(title, description, options = {}) {
  const { full = false, duration = 1800 } = options;
  await removeOverlay();
  await page.evaluate(
    ({ title, description, full }) => {
      const overlay = document.createElement('div');
      overlay.dataset.demoOverlay = 'true';
      overlay.innerHTML = `<div class="demo-card"><span>MediCare+</span><h2>${title}</h2><p>${description}</p></div>`;
      overlay.style.cssText = full
        ? 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:linear-gradient(135deg,rgba(15,76,117,.96),rgba(20,184,166,.92));font-family:Poppins,Arial,sans-serif;color:white;pointer-events:none;'
        : 'position:fixed;left:32px;right:32px;bottom:28px;z-index:2147483647;display:flex;justify-content:center;font-family:Poppins,Arial,sans-serif;color:white;pointer-events:none;';
      const card = overlay.querySelector('.demo-card');
      card.style.cssText = full
        ? 'width:min(720px,80vw);padding:42px 48px;text-align:center;border:1px solid rgba(255,255,255,.28);border-radius:24px;background:rgba(7,39,67,.48);box-shadow:0 24px 70px rgba(0,0,0,.28);backdrop-filter:blur(14px);'
        : 'width:min(720px,calc(100vw - 64px));padding:16px 22px;border:1px solid rgba(255,255,255,.2);border-radius:16px;background:rgba(15,48,73,.94);box-shadow:0 14px 38px rgba(0,0,0,.24);backdrop-filter:blur(12px);';
      const label = card.querySelector('span');
      label.style.cssText =
        'display:block;margin-bottom:5px;color:#72e4d7;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;';
      const heading = card.querySelector('h2');
      heading.style.cssText = full
        ? 'margin:0 0 12px;font-size:42px;line-height:1.15;'
        : 'margin:0 0 4px;font-size:21px;line-height:1.25;';
      const paragraph = card.querySelector('p');
      paragraph.style.cssText = full
        ? 'margin:0;color:#e8f8fb;font-size:18px;line-height:1.6;'
        : 'margin:0;color:#dcecf3;font-size:14px;line-height:1.45;';
      document.body.appendChild(overlay);
    },
    { title, description, full },
  );
  await wait(duration);
  await removeOverlay();
}

async function visit(route, title, description) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await wait(250);
  await showOverlay(title, description, { duration: 650 });
  await page.evaluate(() =>
    window.scrollTo({ top: Math.min(420, document.body.scrollHeight / 4), behavior: 'smooth' }),
  );
  await wait(300);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(150);
}

try {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle', timeout: 45_000 });
  await showOverlay(
    'MediCare+ Hospital Management',
    'A complete, secure platform for connected patient care and hospital operations.',
    {
      full: true,
      duration: 2200,
    },
  );
  await showOverlay(
    'Secure multilingual sign-in',
    'Role-based access, saved language preferences, and RTL-ready authentication.',
    {
      duration: 1000,
    },
  );
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 20_000 });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

  await showOverlay(
    'One connected hospital workspace',
    'Real-time operational visibility, role-aware navigation, notifications, and rapid search.',
    {
      full: true,
      duration: 1400,
    },
  );
  await visit(
    '/dashboard',
    'Executive Dashboard',
    'Live KPIs, appointments, patient activity, workload, and operational trends.',
  );

  await showOverlay(
    'Patient journey',
    'From registration and scheduling to consultation, admission, and discharge.',
    {
      full: true,
      duration: 1100,
    },
  );
  await visit(
    '/patients',
    'Patient Management',
    'Searchable patient records, demographics, medical context, and document history.',
  );
  await visit(
    '/appointments',
    'Appointments',
    'Scheduling, rescheduling, status workflows, billing visibility, and invoice actions.',
  );
  await visit(
    '/opd',
    'OPD & Queue',
    'Queue tracking, consultation flow, priorities, and waiting-time visibility.',
  );
  await visit(
    '/clinical',
    'Clinical EMR',
    'Clinical encounters, diagnoses, prescriptions, notes, and longitudinal records.',
  );

  await showOverlay(
    'Inpatient and clinical operations',
    'Coordinated care across beds, wards, nursing, and operating theatres.',
    {
      full: true,
      duration: 1100,
    },
  );
  await visit(
    '/inpatient',
    'Admissions & Beds',
    'Admissions, occupancy, transfers, discharge workflows, and bed availability.',
  );
  await visit(
    '/nursing',
    'Nursing',
    'Assignments, nursing notes, medication administration, and handovers.',
  );
  await visit(
    '/procedures',
    'Procedures & OT',
    'Procedure scheduling, theatre coordination, teams, and status tracking.',
  );

  await showOverlay(
    'Diagnostics and medication',
    'Connected orders, results, imaging, prescriptions, and stock control.',
    {
      full: true,
      duration: 1100,
    },
  );
  await visit(
    '/laboratory',
    'Laboratory',
    'Orders, sample collection, result processing, and diagnostic status tracking.',
  );
  await visit(
    '/radiology',
    'Radiology',
    'Imaging orders, modality workflows, reporting, and result access.',
  );
  await visit(
    '/pharmacy',
    'Pharmacy',
    'Medicines, prescriptions, dispensing, batches, expiries, and low-stock alerts.',
  );

  await showOverlay(
    'Revenue and coverage',
    'Accurate billing, payment tracking, refunds, policies, and claims.',
    {
      full: true,
      duration: 1100,
    },
  );
  await visit(
    '/billing',
    'Billing',
    'Invoices, payments, refunds, line-item calculations, and financial controls.',
  );
  await visit(
    '/insurance',
    'Insurance',
    'Providers, patient policies, claims, coverage, and approval workflows.',
  );

  await showOverlay(
    'Hospital operations',
    'Inventory, documents, teams, permissions, and organizational administration.',
    {
      full: true,
      duration: 1100,
    },
  );
  await visit(
    '/operations',
    'Inventory & Operations',
    'Supplies, vendors, purchase orders, stock movement, ambulances, and operational assets.',
  );
  await visit(
    '/documents',
    'Documents',
    'Centralized, authorized hospital document management and retrieval.',
  );
  await visit(
    '/doctors',
    'Doctors',
    'Provider directory, specialties, availability, and professional profiles.',
  );
  await visit(
    '/employees',
    'Employees',
    'Workforce directory, employment information, and staff administration.',
  );
  await visit(
    '/departments',
    'Departments',
    'Clinical and administrative department configuration.',
  );
  await visit(
    '/users',
    'Users',
    'Secure account administration, status management, and role assignment.',
  );
  await visit(
    '/roles',
    'Roles & Permissions',
    'Granular RBAC controls for safe, least-privilege access.',
  );

  await showOverlay(
    'Insights, governance, and support',
    'Analytics, traceability, configuration, and ongoing user support.',
    {
      full: true,
      duration: 1100,
    },
  );
  await visit(
    '/reports',
    'Reports & Analytics',
    'Operational and financial insights with filters, trends, and export-ready views.',
  );
  await visit(
    '/audit-logs',
    'Audit Logs',
    'Traceable user activity and security-focused operational history.',
  );
  await visit(
    '/help-support',
    'Help & Support',
    'Knowledge resources, support requests, and guided assistance.',
  );
  await visit(
    '/settings',
    'Settings',
    'Hospital, application, notification, security, language, and support configuration.',
  );

  const airaButton = page.getByRole('button', { name: /Ask Aira/i });
  if (await airaButton.isVisible().catch(() => false)) {
    await airaButton.click();
    await wait(350);
    const newConversationButton = page.getByRole('button', { name: 'New conversation' });
    if (await newConversationButton.isVisible().catch(() => false)) {
      await newConversationButton.click();
      await wait(500);
    }
    await showOverlay(
      'Aira AI Assistant',
      'A secure, role-aware assistant for navigation, reports, hospital information, and operational questions.',
      {
        duration: 1400,
      },
    );
  }

  await showOverlay('MediCare+', 'Smarter healthcare for brighter lives.', {
    full: true,
    duration: 2200,
  });
} finally {
  await removeOverlay();
  await page.close();
  await context.close();
  await browser.close();
}

const recordedPath = await video.path();
await copyFile(recordedPath, outputPath);
const files = await readdir(outputDirectory);
console.log(`Demo created: ${outputPath}`);
console.log(`Output files: ${files.filter((file) => !file.startsWith('.')).join(', ')}`);
