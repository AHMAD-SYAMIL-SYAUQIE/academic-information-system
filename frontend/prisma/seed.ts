import { PrismaClient, Role, Gender, StatusAbsensi } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ========================================
  // 0. CLEANUP DATABASE
  // ========================================
  console.log('🧹 Cleaning up database...');
  // Delete in correct order to avoid foreign key constraints
  await prisma.auditLog.deleteMany({});
  await prisma.laporan.deleteMany({});
  await prisma.nilai.deleteMany({});
  await prisma.izinHadir.deleteMany({});
  await prisma.absensi.deleteMany({});
  await prisma.qRCode.deleteMany({});
  await prisma.sesiAbsensi.deleteMany({});
  await prisma.guruMengajarKelas.deleteMany({});
  await prisma.siswa.deleteMany({});
  await prisma.guru.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.mapel.deleteMany({});
  await prisma.kelas.deleteMany({});
  await prisma.tahunAjaran.deleteMany({});
  await prisma.aturanAkademik.deleteMany({});
  console.log('✅ Database cleaned');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ========================================
  // 1. CREATE TAHUN AJARAN
  // ========================================
  const tahunAjaran = await prisma.tahunAjaran.create({
    data: {
      tahun: '2024/2025',
      semester: 1,
      isActive: true,
      tanggalMulai: new Date('2024-07-15'),
      tanggalSelesai: new Date('2024-12-20'),
    },
  });
  console.log('✅ Created Tahun Ajaran:', tahunAjaran.tahun);

  // ========================================
  // 2. CREATE ADMIN
  // ========================================
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: Role.ADMIN,
      admin: {
        create: {
          namaLengkap: 'Administrator Sistem',
          email: 'admin@sekolah.sch.id',
          noTelp: '081234567890',
        },
      },
    },
  });
  console.log('✅ Created Admin:', adminUser.username);

  // ========================================
  // 3. CREATE KELAS
  // ========================================
  const kelas10A = await prisma.kelas.create({
    data: {
      namaKelas: '10 IPA 1',
      tingkat: 10,
      jurusan: 'IPA',
      waliKelas: 'Pak Budi Santoso',
      tahunAjaranUuid: tahunAjaran.uuid,
    },
  });

  const kelas10B = await prisma.kelas.create({
    data: {
      namaKelas: '10 IPA 2',
      tingkat: 10,
      jurusan: 'IPA',
      waliKelas: 'Bu Siti Nurhaliza',
      tahunAjaranUuid: tahunAjaran.uuid,
    },
  });
  console.log('✅ Created Kelas:', kelas10A.namaKelas, kelas10B.namaKelas);

  // ========================================
  // 4. CREATE MAPEL
  // ========================================
  const mapelMatematika = await prisma.mapel.create({
    data: {
      kodeMapel: 'MAT-101',
      namaMapel: 'Matematika',
      deskripsi: 'Matematika Wajib Kelas 10',
      tahunAjaranUuid: tahunAjaran.uuid,
    },
  });

  const mapelFisika = await prisma.mapel.create({
    data: {
      kodeMapel: 'FIS-101',
      namaMapel: 'Fisika',
      deskripsi: 'Fisika Dasar Kelas 10',
      tahunAjaranUuid: tahunAjaran.uuid,
    },
  });

  const mapelBiologi = await prisma.mapel.create({
    data: {
      kodeMapel: 'BIO-101',
      namaMapel: 'Biologi',
      deskripsi: 'Biologi Dasar Kelas 10',
      tahunAjaranUuid: tahunAjaran.uuid,
    },
  });
  console.log('✅ Created Mapel:', mapelMatematika.namaMapel, mapelFisika.namaMapel, mapelBiologi.namaMapel);

  // ========================================
  // 5. CREATE GURU
  // ========================================
  const guru1User = await prisma.user.create({
    data: {
      username: 'guru1',
      password: hashedPassword,
      role: Role.GURU,
      guru: {
        create: {
          nip: '197501012000031001',
          namaLengkap: 'Dr. Ahmad Wijaya, S.Pd., M.Pd',
          jenisKelamin: Gender.LAKI_LAKI,
          email: 'ahmad.wijaya@sekolah.sch.id',
          noTelp: '081234567891',
          alamat: 'Jl. Pendidikan No. 10, Jakarta',
          tanggalLahir: new Date('1975-01-01'),
        },
      },
    },
  });

  const guru2User = await prisma.user.create({
    data: {
      username: 'guru2',
      password: hashedPassword,
      role: Role.GURU,
      guru: {
        create: {
          nip: '198003152005012002',
          namaLengkap: 'Siti Rahmawati, S.Si., M.Pd',
          jenisKelamin: Gender.PEREMPUAN,
          email: 'siti.rahmawati@sekolah.sch.id',
          noTelp: '081234567892',
          alamat: 'Jl. Guru No. 5, Jakarta',
          tanggalLahir: new Date('1980-03-15'),
        },
      },
    },
  });

  const guru3User = await prisma.user.create({
    data: {
      username: 'guru3',
      password: hashedPassword,
      role: Role.GURU,
      guru: {
        create: {
          nip: '198505202010011003',
          namaLengkap: 'Budi Santoso, S.Pd',
          jenisKelamin: Gender.LAKI_LAKI,
          email: 'budi.santoso@sekolah.sch.id',
          noTelp: '081234567893',
          alamat: 'Jl. Ilmu No. 12, Jakarta',
          tanggalLahir: new Date('1985-05-20'),
        },
      },
    },
  });
  console.log('✅ Created Guru:', guru1User.username, guru2User.username, guru3User.username);

  // ========================================
  // 6. ASSIGN GURU MENGAJAR KELAS
  // ========================================
  const guru1 = await prisma.guru.findUnique({ where: { userUuid: guru1User.uuid } });
  const guru2 = await prisma.guru.findUnique({ where: { userUuid: guru2User.uuid } });
  const guru3 = await prisma.guru.findUnique({ where: { userUuid: guru3User.uuid } });

  await prisma.guruMengajarKelas.createMany({
    data: [
      // Guru 1 mengajar Matematika di 10A dan 10B
      { guruUuid: guru1!.uuid, kelasUuid: kelas10A.uuid, mapelUuid: mapelMatematika.uuid },
      { guruUuid: guru1!.uuid, kelasUuid: kelas10B.uuid, mapelUuid: mapelMatematika.uuid },
      
      // Guru 2 mengajar Fisika di 10A dan 10B
      { guruUuid: guru2!.uuid, kelasUuid: kelas10A.uuid, mapelUuid: mapelFisika.uuid },
      { guruUuid: guru2!.uuid, kelasUuid: kelas10B.uuid, mapelUuid: mapelFisika.uuid },
      
      // Guru 3 mengajar Biologi di 10A dan 10B
      { guruUuid: guru3!.uuid, kelasUuid: kelas10A.uuid, mapelUuid: mapelBiologi.uuid },
      { guruUuid: guru3!.uuid, kelasUuid: kelas10B.uuid, mapelUuid: mapelBiologi.uuid },
    ],
  });
  console.log('✅ Assigned Guru to Kelas & Mapel');

  // ========================================
  // 7. CREATE SISWA
  // ========================================
  const siswaData = [
    {
      username: 'siswa1',
      nis: '2024001',
      namaLengkap: 'Andi Prasetyo',
      jenisKelamin: Gender.LAKI_LAKI,
      kelasUuid: kelas10A.uuid,
      email: 'andi.prasetyo@student.sch.id',
      noTelp: '081234560001',
      tanggalLahir: new Date('2009-03-15'),
      namaWali: 'Bapak Prasetyo',
      noTelpWali: '081234560011',
    },
    {
      username: 'siswa2',
      nis: '2024002',
      namaLengkap: 'Budi Santoso',
      jenisKelamin: Gender.LAKI_LAKI,
      kelasUuid: kelas10A.uuid,
      email: 'budi.santoso@student.sch.id',
      noTelp: '081234560002',
      tanggalLahir: new Date('2009-05-20'),
      namaWali: 'Bapak Santoso',
      noTelpWali: '081234560022',
    },
    {
      username: 'siswa3',
      nis: '2024003',
      namaLengkap: 'Citra Dewi',
      jenisKelamin: Gender.PEREMPUAN,
      kelasUuid: kelas10A.uuid,
      email: 'citra.dewi@student.sch.id',
      noTelp: '081234560003',
      tanggalLahir: new Date('2009-07-10'),
      namaWali: 'Ibu Dewi',
      noTelpWali: '081234560033',
    },
    {
      username: 'siswa4',
      nis: '2024004',
      namaLengkap: 'Dini Amelia',
      jenisKelamin: Gender.PEREMPUAN,
      kelasUuid: kelas10B.uuid,
      email: 'dini.amelia@student.sch.id',
      noTelp: '081234560004',
      tanggalLahir: new Date('2009-08-25'),
      namaWali: 'Ibu Amelia',
      noTelpWali: '081234560044',
    },
    {
      username: 'siswa5',
      nis: '2024005',
      namaLengkap: 'Eko Saputra',
      jenisKelamin: Gender.LAKI_LAKI,
      kelasUuid: kelas10B.uuid,
      email: 'eko.saputra@student.sch.id',
      noTelp: '081234560005',
      tanggalLahir: new Date('2009-09-30'),
      namaWali: 'Bapak Saputra',
      noTelpWali: '081234560055',
    },
  ];

  for (const siswa of siswaData) {
    await prisma.user.create({
      data: {
        username: siswa.username,
        password: hashedPassword,
        role: Role.SISWA,
        siswa: {
          create: {
            nis: siswa.nis,
            namaLengkap: siswa.namaLengkap,
            jenisKelamin: siswa.jenisKelamin,
            kelasUuid: siswa.kelasUuid,
            email: siswa.email,
            noTelp: siswa.noTelp,
            tanggalLahir: siswa.tanggalLahir,
            namaWali: siswa.namaWali,
            noTelpWali: siswa.noTelpWali,
          },
        },
      },
    });
  }
  console.log('✅ Created', siswaData.length, 'Siswa');

  // ========================================
  // 8. CREATE ATURAN AKADEMIK
  // ========================================
  await prisma.aturanAkademik.create({
    data: {
      namaAturan: 'Aturan Penilaian Default',
      bobotTugas: 20,
      bobotUH: 20,
      bobotUTS: 30,
      bobotUAS: 30,
      minKehadiranPersen: 75,
    },
  });
  console.log('✅ Created Aturan Akademik');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Default Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔴 ADMIN:');
  console.log('   Username: admin');
  console.log('   Password: password123');
  console.log('\n🟡 GURU (contoh):');
  console.log('   Username: guru1');
  console.log('   Password: password123');
  console.log('\n🔵 SISWA (contoh):');
  console.log('   Username: siswa1');
  console.log('   Password: password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
