import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const guruUuid = url.searchParams.get('guruUuid')

    if (!guruUuid) {
      return NextResponse.json({ message: 'guruUuid query param is required' }, { status: 400 })
    }

    // 1. Get kelas ajar and siswa count
    const guruMengajar = await prisma.guruMengajarKelas.findMany({
      where: { guruUuid },
      include: {
        kelas: {
          include: {
            _count: {
              select: { siswa: true }
            }
          }
        }
      }
    });

    const kelasIds = guruMengajar.map(gm => gm.kelasUuid);
    const kelasCount = new Set(kelasIds).size;
    const siswaCount = guruMengajar.reduce((acc, gm) => acc + (gm.kelas?.['_count']?.siswa || 0), 0);

    // 2. Get today's active sessions for this teacher
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sesiHariIni = await prisma.sesiAbsensi.findMany({
      where: {
        guruUuid,
        tanggal: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        _count: {
          select: { absensi: true }
        }
      }
    });

    const sesiAktif = sesiHariIni.filter(s => s.status === 'ACTIVE').length;
    const totalAbsensiHariIni = sesiHariIni.reduce((acc, s) => acc + s._count.absensi, 0);
    
    // For simplicity, we assume total students for today's sessions is total students taught by teacher
    const kehadiranHariIni = siswaCount > 0 ? Math.round((totalAbsensiHariIni / siswaCount) * 100) : 0;

    // 3. Get pending izin for classes taught by the teacher
    const izinPending = await prisma.izinHadir.count({
      where: {
        status: 'PENDING',
        siswa: {
          kelasUuid: {
            in: kelasIds
          }
        }
      }
    });

    // 4. Get upcoming schedules (today's sessions for this teacher)
    const schedules = sesiHariIni.map(sesi => ({
      id: sesi.uuid,
      kelas: guruMengajar.find(gm => gm.kelasUuid === sesi.kelasUuid)?.kelas?.namaKelas || 'N/A',
      mapel: 'N/A', // Mapel info is not directly on sesi, would require another query
      jamMulai: sesi.jamMulai,
      jamSelesai: sesi.jamSelesai,
      status: sesi.status === 'ACTIVE' ? 'ongoing' : new Date() > new Date(sesi.tanggal + 'T' + sesi.jamSelesai) ? 'done' : 'upcoming'
    }));

    return NextResponse.json({
      stats: {
        kelasCount,
        siswaCount,
        sesiAktif,
        izinPending,
        kehadiranHariIni,
        totalAbsensiHariIni,
      },
      schedules,
      // Recent activities would be more complex and require a dedicated table or complex queries.
      // Returning empty for now.
      activities: [] 
    });

  } catch (error: any) {
    console.error('Error fetching guru dashboard data:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
