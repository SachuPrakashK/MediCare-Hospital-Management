import { prisma } from '../config/prisma.js';
import { calendarDayBounds } from '../utils/date-time.js';
import { appointmentService } from './appointment.service.js';
import { patientService } from './patient.service.js';
import { phase23Service } from './phase23.service.js';
import { reportsService } from './reports.service.js';

export type AIToolResult = { toolIds: string[]; context: string };

const has = (permissions: string[], permission: string) => permissions.includes(permission);
const json = (value: unknown) => JSON.stringify(value, null, 2);
const patientSearch = (input: string) => {
  const match = input.match(
    /(?:find|search|show|lookup|look up)?\s*(?:a\s+)?patient(?:\s+(?:named|with\s+mrn))?\s+(.+)/i,
  );
  return match?.[1]?.replace(/[?.!]+$/, '').trim();
};

export class AIToolService {
  async execute(input: string, permissions: string[]): Promise<AIToolResult | null> {
    const query = input.toLowerCase();
    const sections: string[] = [];
    const toolIds: string[] = [];

    if (
      /\b(services?(?:\s+are)?\s+offered|hospital services?|available services?|service catalogue|service catalog|departments?|facilities)\b/.test(
        query,
      )
    ) {
      const catalogueEntries: Array<readonly [string, string]> = [
        ['appointments.view', 'Appointments and scheduling'],
        ['queue.view', 'Outpatient department and queue management'],
        ['clinical.view', 'Clinical consultations and electronic medical records'],
        ['laboratory.view', 'Laboratory orders, sample collection, and results'],
        ['radiology.view', 'Radiology orders and diagnostic reports'],
        ['admissions.view', 'Admissions, beds, transfers, and discharge workflows'],
        ['nursing.view', 'Nursing assignments, notes, medication administration, and handovers'],
        ['procedures.view', 'Procedures and operation theatre workflows'],
        ['pharmacy.view', 'Pharmacy, prescriptions, medicine stock, and dispensing'],
        ['billing.view', 'Invoices, payments, refunds, and financial records'],
        ['insurance.view', 'Insurance providers, policies, and claims'],
        ['ambulance.view', 'Ambulance fleet and booking coordination'],
        ['reports.view', 'Operational reports and analytics'],
        ['documents.view', 'Authorized hospital document management'],
      ];
      const catalogue = catalogueEntries
        .filter((entry) => has(permissions, entry[0]))
        .map((entry) => entry[1]);
      toolIds.push('get_service_catalog');
      sections.push(
        `MEDICARE+ SERVICE CATALOGUE FOR THIS USER:\n${json(catalogue)}\nThis service-category information is general operational information, not confidential patient data.`,
      );
    }

    if (/\b(patient|mrn)\b/.test(query)) {
      if (!has(permissions, 'patients.view')) {
        sections.push('Patient search is unavailable because the user lacks patients.view.');
      } else {
        const search = patientSearch(input);
        if (!search || search.length < 2 || /^(details?|information|records?)$/i.test(search)) {
          sections.push('Ask the user for a patient name or MRN before searching.');
        } else {
          const result = await patientService.list({
            page: 1,
            page_size: 10,
            search,
            sort_by: 'firstName',
            sort_order: 'asc',
          });
          toolIds.push('search_patients');
          sections.push(
            `PATIENT SEARCH (${result.pagination.total} matches):\n${json(
              result.data.map((item) => ({
                id: item.id,
                mrn: item.mrn,
                name: `${item.firstName} ${item.lastName}`.trim(),
                gender: item.gender,
                status: item.status,
                route: `/patients/${item.id}`,
              })),
            )}`,
          );
        }
      }
    }

    const asksAppointments = /\bappointments?\b/.test(query);
    const asksPending =
      /\b(pending|outstanding|unpaid)\b/.test(query) &&
      /\b(payments?|invoices?|bills?)\b/.test(query);
    if (asksAppointments || asksPending) {
      if (!has(permissions, 'appointments.view')) {
        sections.push(
          'Appointment details are unavailable because the user lacks appointments.view.',
        );
      } else {
        const settings = await prisma.applicationSettings.findUnique({ where: { id: 'default' } });
        const today = /\btoday'?s?\b/.test(query);
        const bounds = today
          ? calendarDayBounds(new Date(), settings?.timezone ?? 'Asia/Kolkata')
          : null;
        const result = await appointmentService.list({
          page: 1,
          page_size: 10,
          ...(asksPending ? { payment_status: 'Pending' } : {}),
          ...(bounds
            ? { start_date: bounds.start.toISOString(), end_date: bounds.end.toISOString() }
            : {}),
          sort_by: 'appointmentAt',
          sort_order: 'asc',
        });
        toolIds.push('search_appointments');
        sections.push(
          `APPOINTMENTS (${result.pagination.total} matches; first 10 shown):\n${json(
            result.data.map((item) => ({
              id: item.id,
              number: item.number,
              patient: item.patientName,
              mrn: item.patientMrn,
              doctor: item.doctor,
              department: item.department,
              scheduledAt: item.appointmentAt,
              status: item.status,
              paymentStatus: item.paymentStatus,
              outstandingBalance: item.outstandingBalance,
              route: `/appointments/${item.id}`,
            })),
          )}`,
        );
      }
    }

    if (/\b(reports?|analytics|statistics|hospital summary|overview)\b/.test(query)) {
      if (!has(permissions, 'reports.view')) {
        sections.push('Reports are unavailable because the user lacks reports.view.');
      } else {
        const report = await reportsService.overview({}, has(permissions, 'billing.view'));
        toolIds.push('get_report_summary');
        sections.push(
          `HOSPITAL REPORT SUMMARY:\n${json({
            ...report.summary,
            appointment_statuses: report.appointment_statuses,
            route: '/reports',
          })}`,
        );
      }
    }

    if (/\b(low[ -]?stock|stock shortage|reorder)\b/.test(query)) {
      if (!has(permissions, 'pharmacy.view')) {
        sections.push('Medicine stock is unavailable because the user lacks pharmacy.view.');
      } else {
        const result = await phase23Service.pharmacy.batches({
          page: 1,
          page_size: 10,
          low_stock: 'true',
          sort_by: 'quantity',
          sort_order: 'asc',
        });
        toolIds.push('get_low_stock_medicines');
        sections.push(
          `LOW-STOCK MEDICINES (${result.meta.low_stock_total} batches; first 10 shown):\n${json(
            result.data.map((item: any) => ({
              medicine: item.medicine?.name,
              genericName: item.medicine?.genericName,
              batchNumber: item.batchNumber,
              quantity: item.quantity,
              reorderLevel: item.reorderLevel,
              expiresAt: item.expiresAt,
              route: '/pharmacy',
            })),
          )}`,
        );
      }
    }

    return sections.length ? { toolIds, context: sections.join('\n\n') } : null;
  }
}

export const aiToolService = new AIToolService();
