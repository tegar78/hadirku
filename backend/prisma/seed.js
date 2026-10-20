const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for HadirKu...');

  // 1. Office Setting
  const office = await prisma.officeSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      officeName: 'Kantor Pusat HadirKu Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      radiusMeters: 100.0,
    },
  });
  console.log('Created Office Setting:', office.officeName);

  // 2. Shifts
  const regularShift = await prisma.shift.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      shiftName: 'Shift Reguler (08:00 - 17:00)',
      startTime: '08:00:00',
      endTime: '17:00:00',
      lateToleranceMinutes: 15,
    },
  });

  const morningShift = await prisma.shift.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      shiftName: 'Shift Pagi (07:00 - 15:30)',
      startTime: '07:00:00',
      endTime: '15:30:00',
      lateToleranceMinutes: 15,
    },
  });
  console.log('Created Shifts: Regular & Morning');

  // 3. Password hash
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  // 4. HR Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hadirku.com' },
    update: {},
    create: {
      nip: 'ADM-001',
      fullName: 'Admin HR HadirKu',
      email: 'admin@hadirku.com',
      passwordHash: defaultPasswordHash,
      role: 'hr_admin',
      department: 'Human Resources',
      position: 'HR Manager',
      leaveQuota: 12,
      isActive: true,
    },
  });
  console.log('Created Admin User:', admin.email);

  // 5. Employees
  const emp1 = await prisma.user.upsert({
    where: { email: 'budi@hadirku.com' },
    update: {},
    create: {
      nip: 'EMP-001',
      fullName: 'Budi Santoso',
      email: 'budi@hadirku.com',
      passwordHash: defaultPasswordHash,
      role: 'employee',
      department: 'IT Engineering',
      position: 'Senior Frontend Developer',
      leaveQuota: 10,
      isActive: true,
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: 'siti@hadirku.com' },
    update: {},
    create: {
      nip: 'EMP-002',
      fullName: 'Siti Rahmawati',
      email: 'siti@hadirku.com',
      passwordHash: defaultPasswordHash,
      role: 'employee',
      department: 'IT Engineering',
      position: 'Backend Developer',
      leaveQuota: 12,
      isActive: true,
    },
  });

  const emp3 = await prisma.user.upsert({
    where: { email: 'tegar@hadirku.com' },
    update: {},
    create: {
      nip: 'EMP-003',
      fullName: 'Tegar Pratama',
      email: 'tegar@hadirku.com',
      passwordHash: defaultPasswordHash,
      role: 'employee',
      department: 'Operations',
      position: 'Operations Coordinator',
      leaveQuota: 11,
      isActive: true,
    },
  });
  console.log('Created Employees:', emp1.fullName, emp2.fullName, emp3.fullName);

  // 6. User Schedules
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.userSchedule.upsert({
    where: {
      userId_effectiveDate: {
        userId: emp1.id,
        effectiveDate: today,
      },
    },
    update: {},
    create: {
      userId: emp1.id,
      shiftId: regularShift.id,
      effectiveDate: today,
    },
  });

  await prisma.userSchedule.upsert({
    where: {
      userId_effectiveDate: {
        userId: emp2.id,
        effectiveDate: today,
      },
    },
    update: {},
    create: {
      userId: emp2.id,
      shiftId: regularShift.id,
      effectiveDate: today,
    },
  });

  // 7. Seed Sample Today's Attendance for Budi (on_time)
  const clockInBudi = new Date(today);
  clockInBudi.setHours(7, 55, 12);

  await prisma.attendance.upsert({
    where: {
      userId_attendanceDate: {
        userId: emp1.id,
        attendanceDate: today,
      },
    },
    update: {},
    create: {
      userId: emp1.id,
      shiftId: regularShift.id,
      attendanceDate: today,
      clockInTime: clockInBudi,
      latIn: -6.20875,
      longIn: 106.84558,
      distanceInMeters: 6.2,
      status: 'on_time',
      notes: 'Hadir tepat waktu di lobi kantor',
    },
  });

  // 8. Sample Leave Request
  const leaveStart = new Date(today);
  leaveStart.setDate(leaveStart.getDate() + 2);
  const leaveEnd = new Date(leaveStart);
  leaveEnd.setDate(leaveEnd.getDate() + 1);

  await prisma.leaveRequest.create({
    data: {
      userId: emp2.id,
      leaveType: 'annual',
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: 'Keperluan keluarga di luar kota',
      status: 'pending',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
