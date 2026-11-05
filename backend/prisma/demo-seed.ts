import {
  AdmissionStatus,
  AppointmentStatus,
  BedStatus,
  OpdQueueStatus,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();
const now = new Date();
const at = (days: number, hours = 10) => {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  value.setHours(hours, 0, 0, 0);
  return value;
};

async function main() {
  const admin = await prisma.user.findFirst({
    where: { roles: { some: { role: { code: 'HOSPITAL_ADMIN' } } } },
  });
  const doctor = await prisma.user.findFirst({ where: { employeeCode: 'DOC-0001' } });
  const nurse = await prisma.user.findFirst({ where: { employeeCode: 'NUR-0001' } });
  const department = await prisma.department.findUnique({ where: { code: 'GEN' } });
  const ward = await prisma.ward.findUnique({ where: { code: 'MED' } });
  const theatre = await prisma.operationTheatre.findUnique({ where: { code: 'OT-1' } });
  const provider = await prisma.insuranceProvider.findUnique({ where: { code: 'NHA' } });
  const category = await prisma.inventoryCategory.findUnique({ where: { code: 'CONSUMABLES' } });
  if (!admin || !doctor || !nurse || !department || !ward || !theatre || !provider || !category) {
    throw new Error(
      'Run npm run prisma:seed before prisma:seed:demo. Foundational records are missing.',
    );
  }

  const patients = await Promise.all(
    [
      ['DEMO-MRN-001', 'Aarav', 'Sharma', 'Male', 'O+', '+91 90000 10001'],
      ['DEMO-MRN-002', 'Diya', 'Nair', 'Female', 'A+', '+91 90000 10002'],
      ['DEMO-MRN-003', 'Kabir', 'Mehta', 'Male', 'B+', '+91 90000 10003'],
    ].map(([mrn, firstName, lastName, gender, bloodGroup, phone], index) =>
      prisma.patient.upsert({
        where: { mrn },
        update: { firstName, lastName, gender, bloodGroup, phone, status: 'Active' },
        create: {
          mrn,
          firstName,
          lastName,
          gender,
          bloodGroup,
          phone,
          dob: new Date(1985 + index * 7, index + 1, 12),
          email: `demo.patient${index + 1}@example.test`,
          city: 'Bengaluru',
          emergencyContact: `+91 90000 2000${index + 1}`,
          allergies: index === 0 ? ['Penicillin'] : [],
        },
      }),
    ),
  );
  const [patient, inpatient, insuredPatient] = patients;

  const appointment = await prisma.appointment.upsert({
    where: { number: 'DEMO-APT-001' },
    update: { appointmentAt: at(0, 10), status: AppointmentStatus.COMPLETED },
    create: {
      number: 'DEMO-APT-001',
      patientId: patient.id,
      departmentId: department.id,
      doctorId: doctor.id,
      appointmentAt: at(0, 10),
      type: 'Follow-up',
      consultationType: 'In Person',
      reason: 'Hypertension review',
      fee: 800,
      status: AppointmentStatus.COMPLETED,
    },
  });
  await prisma.appointment.upsert({
    where: { number: 'DEMO-APT-002' },
    update: { appointmentAt: at(1, 11), status: AppointmentStatus.CONFIRMED },
    create: {
      number: 'DEMO-APT-002',
      patientId: insuredPatient.id,
      departmentId: department.id,
      doctorId: doctor.id,
      appointmentAt: at(1, 11),
      type: 'New Consultation',
      consultationType: 'In Person',
      reason: 'Recurring headache',
      fee: 800,
      status: AppointmentStatus.CONFIRMED,
    },
  });
  await prisma.opdQueueEntry.upsert({
    where: { appointmentId: appointment.id },
    update: { queueDate: at(0, 0), status: OpdQueueStatus.COMPLETED },
    create: {
      appointmentId: appointment.id,
      patientId: patient.id,
      departmentId: department.id,
      doctorId: doctor.id,
      queueDate: at(0, 0),
      tokenNumber: 91,
      token: 'DEMO-091',
      status: OpdQueueStatus.COMPLETED,
      checkedInAt: at(0, 9),
      completedAt: at(0, 11),
    },
  });
  const consultation = await prisma.consultation.upsert({
    where: { appointmentId: appointment.id },
    update: { notes: 'Synthetic demonstration consultation.' },
    create: {
      appointmentId: appointment.id,
      patientId: patient.id,
      doctorId: doctor.id,
      chiefComplaint: 'Occasional dizziness',
      symptoms: 'Mild headache and fatigue',
      examination: 'Stable, no acute distress',
      notes: 'Synthetic demonstration consultation.',
      treatmentPlan: 'Continue medication, monitor blood pressure',
      followUpDate: at(14, 10),
      followUpInstructions: 'Bring home blood-pressure readings.',
    },
  });
  await prisma.vital.upsert({
    where: { id: 'demo-vital-001' },
    update: { recordedAt: at(0, 10) },
    create: {
      id: 'demo-vital-001',
      patientId: patient.id,
      consultationId: consultation.id,
      temperature: 36.8,
      pulse: 76,
      systolic: 128,
      diastolic: 82,
      spo2: 98,
      height: 172,
      weight: 71,
      bmi: 24,
      painScore: 1,
      recordedById: nurse.id,
    },
  });
  await prisma.diagnosis.upsert({
    where: { id: 'demo-diagnosis-001' },
    update: { description: 'Essential hypertension' },
    create: {
      id: 'demo-diagnosis-001',
      patientId: patient.id,
      consultationId: consultation.id,
      code: 'I10',
      description: 'Essential hypertension',
      type: 'Primary',
      status: 'Active',
    },
  });
  await prisma.clinicalNote.upsert({
    where: { id: 'demo-note-001' },
    update: { content: 'Blood pressure is controlled on current therapy.' },
    create: {
      id: 'demo-note-001',
      consultationId: consultation.id,
      authorId: doctor.id,
      noteType: 'Progress Note',
      content: 'Blood pressure is controlled on current therapy.',
    },
  });
  await prisma.patientAllergy.upsert({
    where: { id: 'demo-allergy-001' },
    update: { active: true },
    create: {
      id: 'demo-allergy-001',
      patientId: patient.id,
      substance: 'Penicillin',
      reaction: 'Rash',
      severity: 'Moderate',
    },
  });
  await prisma.medicalHistory.upsert({
    where: { id: 'demo-history-001' },
    update: { notes: 'Synthetic demo history.' },
    create: {
      id: 'demo-history-001',
      patientId: patient.id,
      category: 'Chronic',
      condition: 'Hypertension',
      notes: 'Synthetic demo history.',
      onsetDate: new Date('2022-03-01'),
    },
  });
  const prescription = await prisma.prescription.upsert({
    where: { number: 'DEMO-RX-001' },
    update: { status: 'Active' },
    create: {
      number: 'DEMO-RX-001',
      patientId: patient.id,
      consultationId: consultation.id,
      doctorId: doctor.id,
      status: 'Active',
      notes: 'Demo prescription.',
    },
  });
  const prescriptionItem = await prisma.prescriptionItem.upsert({
    where: { id: 'demo-rx-item-001' },
    update: { quantity: 30 },
    create: {
      id: 'demo-rx-item-001',
      prescriptionId: prescription.id,
      medicine: 'Amlodipine',
      strength: '5 mg',
      dose: '1 tablet',
      frequency: 'Once daily',
      route: 'Oral',
      duration: '30 days',
      quantity: 30,
      instructions: 'Take after breakfast.',
    },
  });
  await prisma.followUp.upsert({
    where: { id: 'demo-followup-001' },
    update: { scheduledAt: at(14, 10) },
    create: {
      id: 'demo-followup-001',
      patientId: patient.id,
      consultationId: consultation.id,
      scheduledAt: at(14, 10),
      instructions: 'Review blood-pressure log.',
      status: 'Scheduled',
    },
  });

  const cbc = await prisma.laboratoryTestDefinition.findUniqueOrThrow({ where: { code: 'CBC' } });
  const labOrder = await prisma.labOrder.upsert({
    where: { number: 'DEMO-LAB-001' },
    update: { status: 'Verified' },
    create: {
      number: 'DEMO-LAB-001',
      patientId: patient.id,
      doctorId: doctor.id,
      doctor: 'Dr. Vikram Rao',
      tests: ['Complete Blood Count'],
      priority: 'Routine',
      clinicalNotes: 'Annual review',
      sampleType: 'Blood',
      collectedAt: at(-1, 9),
      collectedBy: 'Demo Lab Technician',
      status: 'Verified',
    },
  });
  await prisma.labOrderTest.upsert({
    where: { orderId_testDefinitionId: { orderId: labOrder.id, testDefinitionId: cbc.id } },
    update: {},
    create: { orderId: labOrder.id, testDefinitionId: cbc.id },
  });
  await prisma.labResult.upsert({
    where: { id: 'demo-lab-result-001' },
    update: { value: '13.8' },
    create: {
      id: 'demo-lab-result-001',
      orderId: labOrder.id,
      test: 'Haemoglobin',
      value: '13.8',
      unit: 'g/dL',
      referenceRange: '12-16',
      abnormal: false,
      enteredBy: 'Demo Lab Technician',
      verifiedBy: 'Dr. Vikram Rao',
      verifiedAt: at(-1, 14),
    },
  });
  await prisma.radiologyOrder.upsert({
    where: { number: 'DEMO-RAD-001' },
    update: { status: 'Reported' },
    create: {
      number: 'DEMO-RAD-001',
      patientId: insuredPatient.id,
      investigation: 'Chest X-Ray',
      doctor: 'Dr. Vikram Rao',
      scheduledAt: at(1, 14),
      findings: 'No acute abnormality.',
      impression: 'Normal chest radiograph.',
      reportedBy: 'Demo Radiologist',
      status: 'Reported',
    },
  });

  const room = await prisma.room.findUniqueOrThrow({ where: { name: '101' } });
  const bed = await prisma.bed.findFirstOrThrow({ where: { roomId: room.id, name: 'A-101-1' } });
  const admission = await prisma.admission.upsert({
    where: { number: 'DEMO-ADM-001' },
    update: { status: AdmissionStatus.ADMITTED },
    create: {
      number: 'DEMO-ADM-001',
      patientId: inpatient.id,
      departmentId: department.id,
      attendingDoctorId: doctor.id,
      admittedAt: at(-1, 15),
      type: 'Emergency',
      reason: 'Dehydration and observation',
      initialDiagnosis: 'Acute gastroenteritis',
      status: AdmissionStatus.ADMITTED,
    },
  });
  await prisma.bed.update({ where: { id: bed.id }, data: { status: BedStatus.OCCUPIED } });
  await prisma.bedAllocation.upsert({
    where: { id: 'demo-allocation-001' },
    update: { endedAt: null },
    create: {
      id: 'demo-allocation-001',
      admissionId: admission.id,
      bedId: bed.id,
      startedAt: at(-1, 16),
      reason: 'Initial admission',
    },
  });
  await prisma.nurseAssignment.upsert({
    where: { id: 'demo-assignment-001' },
    update: { endedAt: null },
    create: {
      id: 'demo-assignment-001',
      admissionId: admission.id,
      nurseId: nurse.id,
      shift: 'MORNING',
      startedAt: at(0, 7),
      assignedById: admin.id,
    },
  });
  await prisma.nursingNote.upsert({
    where: { id: 'demo-nursing-note-001' },
    update: { notes: 'Patient comfortable; continue observation.' },
    create: {
      id: 'demo-nursing-note-001',
      admissionId: admission.id,
      nurseId: nurse.id,
      observation: 'Hydration improving',
      intervention: 'Oral fluids encouraged',
      notes: 'Patient comfortable; continue observation.',
      recordedAt: at(0, 8),
    },
  });
  await prisma.carePlan.upsert({
    where: { id: 'demo-care-plan-001' },
    update: { reviewDate: at(1, 9) },
    create: {
      id: 'demo-care-plan-001',
      admissionId: admission.id,
      problem: 'Fluid deficit',
      goal: 'Restore hydration',
      intervention: 'Monitor intake and output',
      notes: 'Demo plan',
      status: 'Active',
      reviewDate: at(1, 9),
    },
  });
  await prisma.intakeOutput.upsert({
    where: { id: 'demo-intake-001' },
    update: { amountMl: 500 },
    create: {
      id: 'demo-intake-001',
      admissionId: admission.id,
      kind: 'INTAKE',
      category: 'Oral fluids',
      amountMl: 500,
      recordedById: nurse.id,
      recordedAt: at(0, 9),
    },
  });
  await prisma.medicationAdministration.upsert({
    where: { id: 'demo-med-admin-001' },
    update: { status: 'Administered' },
    create: {
      id: 'demo-med-admin-001',
      admissionId: admission.id,
      medication: 'Amlodipine 5 mg',
      scheduledAt: at(0, 9),
      dose: '5 mg',
      route: 'Oral',
      administeredAt: at(0, 9),
      administeredById: nurse.id,
      prescriptionItemId: prescriptionItem.id,
      status: 'Administered',
      notes: 'Administered as prescribed.',
    },
  });
  await prisma.shiftHandover.upsert({
    where: { id: 'demo-handover-001' },
    update: { status: 'ACKNOWLEDGED' },
    create: {
      id: 'demo-handover-001',
      admissionId: admission.id,
      fromShift: 'NIGHT',
      toShift: 'MORNING',
      handedOverById: nurse.id,
      handedOverToId: nurse.id,
      clinicalSummary: 'Stable overnight',
      currentCondition: 'Improving',
      importantObservations: 'Monitor hydration',
      pendingTasks: 'Repeat vitals',
      status: 'ACKNOWLEDGED',
      acknowledgedById: nurse.id,
      acknowledgedAt: at(0, 7),
    },
  });
  await prisma.procedure.upsert({
    where: { id: 'demo-procedure-001' },
    update: { scheduledAt: at(2, 12) },
    create: {
      id: 'demo-procedure-001',
      patientId: insuredPatient.id,
      doctorId: doctor.id,
      theatreId: theatre.id,
      name: 'Diagnostic endoscopy',
      team: ['Dr. Vikram Rao', 'Demo Nurse'],
      scheduledAt: at(2, 12),
      durationMinutes: 45,
      indication: 'Persistent symptoms',
      notes: 'Synthetic demo procedure.',
      status: 'Scheduled',
      preOpChecklist: ['Consent verified', 'Fasting confirmed'],
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: 'DEMO-SUP-001' },
    update: { isActive: true },
    create: {
      code: 'DEMO-SUP-001',
      name: 'Demo Medical Supplies',
      contactPerson: 'Demo Contact',
      phone: '+91 90000 30001',
      email: 'supplier@example.test',
      isActive: true,
    },
  });
  const inventoryItem = await prisma.inventoryItem.upsert({
    where: { code: 'DEMO-INV-001' },
    update: { quantity: 24, reorderLevel: 20 },
    create: {
      code: 'DEMO-INV-001',
      name: 'Sterile Examination Gloves',
      categoryId: category.id,
      supplierId: supplier.id,
      unit: 'Box',
      store: 'Main Store',
      quantity: 24,
      reorderLevel: 20,
      expiresAt: at(365),
    },
  });
  await prisma.inventoryMovement.upsert({
    where: { id: 'demo-inventory-movement-001' },
    update: { balance: 24 },
    create: {
      id: 'demo-inventory-movement-001',
      itemId: inventoryItem.id,
      type: 'RECEIPT',
      quantity: 24,
      balance: 24,
      reference: 'DEMO-GRN-001',
      notes: 'Synthetic opening stock',
      actorId: admin.id,
    },
  });
  const medicine = await prisma.medicine.upsert({
    where: { barcode: 'DEMO-MED-001' },
    update: { status: 'Active' },
    create: {
      name: 'Amlodipine',
      genericName: 'Amlodipine',
      brand: 'DemoHealth',
      category: 'Cardiovascular',
      strength: '5 mg',
      form: 'Tablet',
      unit: 'Tablet',
      barcode: 'DEMO-MED-001',
      status: 'Active',
    },
  });
  const batch = await prisma.medicineBatch.upsert({
    where: { medicineId_batchNumber: { medicineId: medicine.id, batchNumber: 'DEMO-BATCH-001' } },
    update: { quantity: 18, reorderLevel: 20 },
    create: {
      medicineId: medicine.id,
      batchNumber: 'DEMO-BATCH-001',
      expiresAt: at(300),
      purchasePrice: 2.5,
      sellingPrice: 5,
      quantity: 18,
      reorderLevel: 20,
    },
  });
  await prisma.stockTransaction.upsert({
    where: { id: 'demo-stock-transaction-001' },
    update: { quantity: 18 },
    create: {
      id: 'demo-stock-transaction-001',
      batchId: batch.id,
      type: 'RECEIPT',
      quantity: 18,
      referenceType: 'OPENING_STOCK',
      referenceId: 'DEMO-STOCK',
      actorId: admin.id,
    },
  });
  await prisma.purchaseOrder.upsert({
    where: { number: 'DEMO-PO-001' },
    update: { status: 'Ordered' },
    create: {
      number: 'DEMO-PO-001',
      supplierId: supplier.id,
      itemType: 'INVENTORY',
      inventoryItemId: inventoryItem.id,
      quantity: 50,
      unitPrice: 420,
      status: 'Ordered',
    },
  });

  const invoice = await prisma.invoice.upsert({
    where: { number: 'DEMO-INV-2026-001' },
    update: { status: 'Partially Paid' },
    create: {
      number: 'DEMO-INV-2026-001',
      patientId: patient.id,
      status: 'Partially Paid',
      createdById: admin.id,
      idempotencyKey: 'demo-invoice-001',
    },
  });
  await prisma.invoiceItem.upsert({
    where: { source_sourceId: { source: 'DEMO', sourceId: 'DEMO-CONSULT-001' } },
    update: { unitPrice: 800 },
    create: {
      invoiceId: invoice.id,
      source: 'DEMO',
      sourceId: 'DEMO-CONSULT-001',
      description: 'General consultation',
      quantity: 1,
      unitPrice: 800,
    },
  });
  const payment = await prisma.payment.upsert({
    where: { idempotencyKey: 'demo-payment-001' },
    update: { amount: 500 },
    create: {
      receiptNumber: 'DEMO-RCPT-001',
      invoiceId: invoice.id,
      amount: 500,
      method: 'Card',
      reference: 'DEMO-TXN-001',
      actorId: admin.id,
      idempotencyKey: 'demo-payment-001',
    },
  });
  await prisma.refund.upsert({
    where: { idempotencyKey: 'demo-refund-001' },
    update: { status: 'Approved' },
    create: {
      paymentId: payment.id,
      amount: 100,
      reason: 'Synthetic duplicate charge correction',
      status: 'Approved',
      requestedById: admin.id,
      approvedById: admin.id,
      idempotencyKey: 'demo-refund-001',
    },
  });
  const policy = await prisma.patientInsurance.upsert({
    where: { policyNumber: 'DEMO-POLICY-001' },
    update: { isActive: true, endsAt: at(365) },
    create: {
      patientId: insuredPatient.id,
      providerId: provider.id,
      policyNumber: 'DEMO-POLICY-001',
      memberNumber: 'DEMO-MEMBER-001',
      startsAt: at(-30),
      endsAt: at(365),
      coverageLimit: 500000,
      relationship: 'Self',
      priority: 'Primary',
    },
  });
  await prisma.insuranceClaim.upsert({
    where: { number: 'DEMO-CLAIM-001' },
    update: { status: 'Submitted' },
    create: {
      number: 'DEMO-CLAIM-001',
      patientId: insuredPatient.id,
      insuranceId: policy.id,
      invoiceId: invoice.id,
      claimedAmount: 800,
      approvedAmount: 0,
      rejectedAmount: 0,
      patientResponsibility: 0,
      status: 'Submitted',
      submittedAt: at(0, 12),
    },
  });
  const dispense = await prisma.pharmacyDispense.upsert({
    where: { number: 'DEMO-DISP-001' },
    update: { status: 'Ready' },
    create: {
      number: 'DEMO-DISP-001',
      patientId: patient.id,
      prescriptionRef: prescription.number,
      pharmacistId: admin.id,
      status: 'Ready',
    },
  });
  await prisma.pharmacyDispenseItem.upsert({
    where: { id: 'demo-dispense-item-001' },
    update: { prescribedQuantity: 30 },
    create: {
      id: 'demo-dispense-item-001',
      dispenseId: dispense.id,
      medicineId: medicine.id,
      batchId: batch.id,
      prescribedQuantity: 30,
      dispensedQuantity: 0,
      unitPrice: 5,
    },
  });

  const ambulance = await prisma.ambulance.upsert({
    where: { number: 'DEMO-AMB-001' },
    update: { status: 'Available', isActive: true },
    create: {
      number: 'DEMO-AMB-001',
      registration: 'KA-DEMO-1001',
      vehicleType: 'Advanced Life Support',
      driver: 'Demo Driver',
      driverContact: '+91 90000 40001',
      status: 'Available',
    },
  });
  await prisma.ambulanceBooking.upsert({
    where: { number: 'DEMO-AMB-BOOK-001' },
    update: { status: 'Completed' },
    create: {
      number: 'DEMO-AMB-BOOK-001',
      patientId: inpatient.id,
      ambulanceId: ambulance.id,
      pickup: 'Demo Residence',
      destination: 'MediCare+ Hospital',
      requestedAt: at(-2, 8),
      tripStartedAt: at(-2, 9),
      tripEndedAt: at(-2, 10),
      charges: 1200,
      status: 'Completed',
    },
  });
  await prisma.document.upsert({
    where: { storageKey: 'demo/documents/patient-summary.txt' },
    update: { deletedAt: null },
    create: {
      patientId: patient.id,
      ownerType: 'PATIENT',
      ownerId: patient.id,
      storageKey: 'demo/documents/patient-summary.txt',
      originalName: 'demo-patient-summary.txt',
      mimeType: 'text/plain',
      size: 256,
      sensitive: true,
      uploadedById: admin.id,
    },
  });
  await prisma.helpArticle.upsert({
    where: { id: 'demo-help-article-001' },
    update: { status: 'PUBLISHED' },
    create: {
      id: 'demo-help-article-001',
      category: 'Getting Started',
      title: 'Demo: Navigating MediCare+',
      content: 'Synthetic guide for exploring the demonstration dataset.',
      relatedModule: 'Dashboard',
      status: 'PUBLISHED',
    },
  });
  const ticket = await prisma.supportTicket.upsert({
    where: { ticketNumber: 'DEMO-TICKET-001' },
    update: { status: 'OPEN' },
    create: {
      ticketNumber: 'DEMO-TICKET-001',
      requesterId: admin.id,
      assignedToId: admin.id,
      subject: 'Demo support request',
      module: 'Appointments',
      issueType: 'How-to',
      description: 'Synthetic support ticket used for product demonstrations.',
      priority: 'NORMAL',
      status: 'OPEN',
      currentRoute: '/appointments',
      appVersion: 'demo',
    },
  });
  await prisma.supportTicketStatusHistory.upsert({
    where: { id: 'demo-ticket-history-001' },
    update: { status: 'OPEN' },
    create: {
      id: 'demo-ticket-history-001',
      ticketId: ticket.id,
      status: 'OPEN',
      changedBy: admin.id,
    },
  });
  await prisma.notification.upsert({
    where: { id: 'demo-notification-001' },
    update: { isRead: false },
    create: {
      id: 'demo-notification-001',
      userId: admin.id,
      type: 'DEMO',
      title: 'Demo dataset is ready',
      message: 'Synthetic records are available across MediCare+ modules.',
      relatedEntityType: 'Patient',
      relatedEntityId: patient.id,
    },
  });
  await prisma.auditLog.upsert({
    where: { id: 'demo-audit-001' },
    update: { metadata: { synthetic: true, dataset: 'MediCare+ demo' } },
    create: {
      id: 'demo-audit-001',
      userId: admin.id,
      action: 'DEMO_DATA_SEEDED',
      module: 'system',
      entityType: 'DemoDataset',
      entityId: 'medicare-demo-v1',
      metadata: { synthetic: true, dataset: 'MediCare+ demo' },
      ipAddress: '127.0.0.1',
    },
  });

  console.log(
    JSON.stringify({
      dataset: 'medicare-demo-v1',
      synthetic: true,
      patients: patients.length,
      appointment: appointment.number,
      admission: admission.number,
      invoice: invoice.number,
      modules: 20,
    }),
  );
}

main().finally(() => prisma.$disconnect());
