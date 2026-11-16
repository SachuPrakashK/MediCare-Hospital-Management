import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const guestPermissions = [
  'dashboard.view',
  'patients.view',
  'appointments.view',
  'queue.view',
  'laboratory.view',
  'radiology.view',
  'admissions.view',
  'procedures.view',
  'pharmacy.view',
  'billing.view',
  'insurance.view',
  'inventory.view',
  'ambulance.view',
  'reports.view',
  'doctors.view',
  'departments.view',
  'support.view',
] as const;

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CONFIRM_GUEST_ACCESS_PROVISIONING !== 'YES'
  ) {
    throw new Error(
      'Set CONFIRM_GUEST_ACCESS_PROVISIONING=YES after confirming this production database contains demo data suitable for guest viewing.',
    );
  }

  const permissions = await prisma.permission.findMany({
    where: { code: { in: [...guestPermissions] } },
    select: { id: true, code: true },
  });
  const permissionIds = new Map(permissions.map(({ id, code }) => [code, id]));
  const missing = guestPermissions.filter((code) => !permissionIds.has(code));
  if (missing.length) {
    throw new Error(`Guest role permissions are missing from the database: ${missing.join(', ')}`);
  }

  const guestRole = await prisma.role.findUnique({ where: { code: 'GUEST' } });
  if (!guestRole) {
    throw new Error('The GUEST role is missing. Apply the application seed to a demo database first.');
  }

  const email = 'guest@medicare.demo';
  const username = 'demo-guest';
  const byEmail = await prisma.user.findUnique({ where: { email } });
  const byUsername = await prisma.user.findUnique({ where: { username } });
  if ((byEmail && byEmail.username !== username) || (byUsername && byUsername.email !== email)) {
    throw new Error(
      'The reserved guest email or username belongs to another account; no changes made.',
    );
  }

  const passwordHash = await argon2.hash(randomBytes(48).toString('base64url'));
  await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id: guestRole.id },
      data: {
        name: 'Guest',
        description: 'Read-only access to approved demonstration modules',
        status: 'ACTIVE',
        isSystem: true,
      },
    });
    await tx.rolePermission.deleteMany({ where: { roleId: guestRole.id } });
    await tx.rolePermission.createMany({
      data: guestPermissions.map((code) => ({
        roleId: guestRole.id,
        permissionId: permissionIds.get(code)!,
      })),
    });

    const guest = byEmail ?? byUsername;
    const account = guest
      ? await tx.user.update({
          where: { id: guest.id },
          data: {
            email,
            username,
            firstName: 'Demo',
            lastName: 'Guest',
            status: 'ACTIVE',
            deletedAt: null,
            failedLoginAttempts: 0,
            lockedUntil: null,
            passwordHash,
          },
        })
      : await tx.user.create({
          data: {
            email,
            username,
            firstName: 'Demo',
            lastName: 'Guest',
            status: 'ACTIVE',
            passwordHash,
          },
        });

    await tx.userRole.deleteMany({ where: { userId: account.id } });
    await tx.userRole.create({ data: { userId: account.id, roleId: guestRole.id } });
  });

  console.log('Guest account provisioned with only the curated GUEST role.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
