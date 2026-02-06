import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const guruUuid = url.searchParams.get('guruUuid')
    const status = url.searchParams.get('status')

    if (!guruUuid) {
      return NextResponse.json({ message: 'guruUuid query param is required' }, { status: 400 })
    }

    // 1. Find all classes the guru teaches
    const assignments = await prisma.guruMengajarKelas.findMany({
      where: { guruUuid },
      select: { kelasUuid: true }
    });
    const kelasIds = assignments.map(a => a.kelasUuid);

    // 2. Find all students in those classes
    const studentsInKelas = await prisma.siswa.findMany({
      where: { kelasUuid: { in: kelasIds } },
      select: { uuid: true }
    });
    const siswaIds = studentsInKelas.map(s => s.uuid);

    // 3. Find izin-hadir requests from these students
    const whereClause: any = {
      siswaUuid: { in: siswaIds }
    };

    if (status) {
      whereClause.status = status;
    }

    const izinHadirList = await prisma.izinHadir.findMany({
      where: whereClause,
      include: {
        siswa: {
          select: {
            namaLengkap: true,
            nis: true,
            kelas: {
              select: { namaKelas: true }
            }
          }
        },
        guru: { // Include guru who approved/rejected
          select: {
            namaLengkap: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(izinHadirList);

  } catch (error: any) {
    console.error('Error fetching guru izin-hadir:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { uuid: string } }) {
  try {
    const { uuid } = params;
    const { action, keterangan, guruUuid } = await request.json(); // guruUuid for approval/rejection

    if (!guruUuid) {
      return NextResponse.json({ message: 'guruUuid is required for this action' }, { status: 400 });
    }

    let updatedIzin;
    if (action === 'approve') {
      updatedIzin = await prisma.izinHadir.update({
        where: { uuid },
        data: {
          status: 'APPROVED',
          keterangan: keterangan || null,
          guruUuid: guruUuid // Link the approving guru
        },
      });
    } else if (action === 'reject') {
      updatedIzin = await prisma.izinHadir.update({
        where: { uuid },
        data: {
          status: 'REJECTED',
          keterangan: keterangan || null,
          guruUuid: guruUuid // Link the rejecting guru
        },
      });
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(updatedIzin);

  } catch (error: any) {
    console.error('Error updating izin-hadir:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}