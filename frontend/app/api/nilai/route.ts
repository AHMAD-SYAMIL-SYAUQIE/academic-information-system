import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const query = Object.fromEntries(url.searchParams)

    const where: any = {}
    if (query.kelasUuid) where['siswa'] = { some: { kelasUuid: query.kelasUuid } }
    if (query.mapelUuid) where.mapelUuid = query.mapelUuid

    const list = await prisma.nilai.findMany({ where })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Error get nilai:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siswaUuid, mapelUuid, guruUuid, jenisNilai, nilai, keterangan, skipValidation } = body

    // --- VALIDATION BLOCK ---
    if (!siswaUuid || !mapelUuid || !guruUuid || !jenisNilai || nilai === undefined) {
      return NextResponse.json(
        { message: 'Field siswaUuid, mapelUuid, guruUuid, jenisNilai, dan nilai wajib diisi' },
        { status: 400 }
      )
    }

    // NEW: Validate TeachingAssignment (optional, for improved authorization)
    if (!skipValidation) {
      // Get siswa's kelas
      const siswa = await prisma.siswa.findUnique({
        where: { uuid: siswaUuid },
        select: { kelasUuid: true },
      });

      if (!siswa) {
        return NextResponse.json(
          { message: 'Siswa tidak ditemukan' },
          { status: 404 }
        );
      }

      const activeYear = await prisma.tahunAjaran.findFirst({
        where: { isActive: true },
      });

      if (activeYear) {
        const assignment = await prisma.teachingAssignment.findFirst({
          where: {
            guruUuid,
            kelasUuid: siswa.kelasUuid,
            mapelUuid,
            tahunAjaranUuid: activeYear.uuid,
            semester: activeYear.semester,
            isActive: true,
            endedAt: null,
          },
        });

        if (!assignment) {
          // Check legacy GuruMengajarKelas for backward compatibility
          const legacyAssignment = await prisma.guruMengajarKelas.findFirst({
            where: { guruUuid, kelasUuid: siswa.kelasUuid, mapelUuid },
          });

          if (!legacyAssignment) {
            return NextResponse.json(
              { message: 'Guru tidak memiliki assignment untuk kelas siswa ini' },
              { status: 403 }
            );
          }
        }
      }
    }
    // --- END VALIDATION BLOCK ---

    // NEW: Try to link to TeachingAssignment
    let teachingAssignmentUuid = null;
    const siswa = await prisma.siswa.findUnique({
      where: { uuid: siswaUuid },
      select: { kelasUuid: true },
    });

    if (siswa) {
      const activeYear = await prisma.tahunAjaran.findFirst({
        where: { isActive: true },
      });

      if (activeYear) {
        const assignment = await prisma.teachingAssignment.findFirst({
          where: {
            guruUuid,
            kelasUuid: siswa.kelasUuid,
            mapelUuid,
            tahunAjaranUuid: activeYear.uuid,
            semester: activeYear.semester,
            isActive: true,
          },
        });
        if (assignment) teachingAssignmentUuid = assignment.uuid;
      }
    }

    const created = await prisma.nilai.create({
      data: {
        siswaUuid,
        mapelUuid,
        guruUuid,
        jenisNilai,
        nilai,
        keterangan,
        teachingAssignmentUuid, // NEW: Link to assignment if found
      },
    });

    return NextResponse.json(created)
  } catch (error) {
    console.error('Error create nilai:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
