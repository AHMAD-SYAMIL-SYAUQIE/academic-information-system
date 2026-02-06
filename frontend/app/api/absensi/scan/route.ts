import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { useAuthStore } from '@/lib/auth'; // This cannot be used on the server

// A mock function to get user from a request
// In a real app, this would involve validating a JWT or session cookie
async function getUserByRequest(request: NextRequest) {
  // For now, we'll assume the user's profile is sent in the body,
  // which is NOT secure but necessary given the current app structure.
  // A proper implementation would parse an Authorization header.
  const body = await request.json(); // Need to get a fresh clone of the body
  if (!body.user || !body.user.profile || !body.user.profile.uuid) {
    return null;
  }
  return {
    uuid: body.user.uuid,
    role: body.user.role,
    profile: {
      uuid: body.user.profile.uuid
    }
  };
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, sesiUuid, latitude, longitude, siswaUuid } = body;
    
    console.log('📱 Scan Request:', { token: token?.substring(0, 10) + '...', sesiUuid, siswaUuid, latitude, longitude });

    if (!token || !sesiUuid || !siswaUuid) {
      console.log('❌ Payload tidak lengkap');
      return NextResponse.json({ message: 'Payload tidak lengkap: token, sesiUuid, dan siswaUuid wajib diisi' }, { status: 400 });
    }

    // 1. Verify siswa exists
    const siswa = await prisma.siswa.findUnique({
      where: { uuid: siswaUuid },
      include: { kelas: true, user: true }
    });
    
    if (!siswa) {
      console.log('❌ Siswa tidak ditemukan:', siswaUuid);
      return NextResponse.json({ message: 'Siswa tidak ditemukan' }, { status: 404 });
    }
    
    console.log('✅ Siswa found:', siswa.namaLengkap, '-', siswa.kelas.namaKelas);

    // 2. Find the QR Code by token
    const qrCode = await prisma.qRCode.findUnique({
      where: { token },
      include: { sesiAbsensi: { include: { kelas: true, mapel: true, guru: true } } }
    });

    if (!qrCode) {
      console.log('❌ QR Code tidak ditemukan');
      return NextResponse.json({ message: 'QR Code tidak valid' }, { status: 400 });
    }
    
    console.log('✅ QR Code found for sesi:', qrCode.sesiAbsensi.kelas?.namaKelas, '-', qrCode.sesiAbsensi.mapel?.namaMapel);

    // 3. Validate QR Code matches sesi
    if (qrCode.sesiAbsensiUuid !== sesiUuid) {
      console.log('❌ Sesi UUID mismatch');
      return NextResponse.json({ message: 'QR Code tidak cocok dengan sesi ini' }, { status: 400 });
    }

    // 4. Check if QR expired
    if (qrCode.isExpired || new Date() > new Date(qrCode.expiredAt)) {
      console.log('❌ QR Code expired');
      return NextResponse.json({ message: 'QR Code sudah kedaluwarsa' }, { status: 400 });
    }

    // 5. Validate siswa is in the same class as sesi
    if (qrCode.sesiAbsensi.kelasUuid && siswa.kelasUuid !== qrCode.sesiAbsensi.kelasUuid) {
      console.log('❌ Siswa bukan dari kelas ini');
      return NextResponse.json({ message: 'Anda tidak terdaftar di kelas ini' }, { status: 403 });
    }

    // 6. Check if student has already attended this session
    const existingAbsensi = await prisma.absensi.findFirst({
      where: {
        sesiAbsensiUuid: sesiUuid,
        siswaUuid: siswaUuid,
      },
    });

    if (existingAbsensi) {
      console.log('⚠️ Siswa sudah absen sebelumnya');
      return NextResponse.json({ message: 'Anda sudah melakukan absensi untuk sesi ini' }, { status: 409 });
    }
    
    // 7. Create the attendance record
    const newAbsensi = await prisma.absensi.create({
      data: {
        siswaUuid: siswaUuid,
        sesiAbsensiUuid: sesiUuid,
        status: 'HADIR',
        latitude: latitude || null,
        longitude: longitude || null,
      },
      include: {
        siswa: { include: { kelas: true } },
        sesiAbsensi: { include: { kelas: true, mapel: true } }
      }
    });
    
    console.log('✅ Absensi berhasil tercatat:', siswa.namaLengkap);

    return NextResponse.json({ 
      message: 'Absensi berhasil tercatat!', 
      data: {
        uuid: newAbsensi.uuid,
        siswa: siswa.namaLengkap,
        kelas: siswa.kelas.namaKelas,
        waktu: newAbsensi.scanTime,
        status: newAbsensi.status
      }
    });

  } catch (error) {
    console.error('Error processing scan:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server saat memproses absensi' }, { status: 500 });
  }
}