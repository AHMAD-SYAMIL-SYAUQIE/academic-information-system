import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint retrieves the specific classes and subjects a teacher is assigned to teach.
// Now supports improved TeachingAssignment with temporal tracking
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const guruUuid = url.searchParams.get('guruUuid')
    const useImproved = url.searchParams.get('improved') === 'true' // Optional: use new structure

    if (!guruUuid) {
      return NextResponse.json({ message: 'guruUuid query param is required' }, { status: 400 })
    }

    // Try improved TeachingAssignment first (with active academic year filter)
    if (useImproved) {
      const activeYear = await prisma.tahunAjaran.findFirst({
        where: { isActive: true },
      });

      if (activeYear) {
        const teachingAssignments = await prisma.teachingAssignment.findMany({
          where: {
            guruUuid,
            tahunAjaranUuid: activeYear.uuid,
            semester: activeYear.semester,
            isActive: true,
            endedAt: null, // Only active assignments
          },
          include: {
            kelas: true,
            mapel: true,
            tahunAjaran: true,
          },
        });

        const kelasMap = new Map();
        const mapelMap = new Map();

        teachingAssignments.forEach(assignment => {
          if (assignment.kelas) {
            kelasMap.set(assignment.kelas.uuid, assignment.kelas);
          }
          if (assignment.mapel) {
            mapelMap.set(assignment.mapel.uuid, assignment.mapel);
          }
        });

        return NextResponse.json({
          kelas: Array.from(kelasMap.values()),
          mapel: Array.from(mapelMap.values()),
          assignments: teachingAssignments, // Include full assignments for advanced use
          tahunAjaran: activeYear,
        });
      }
    }

    // Fallback to legacy GuruMengajarKelas for backward compatibility
    const assignments = await prisma.guruMengajarKelas.findMany({
      where: { guruUuid },
      include: {
        kelas: true,
        mapel: true,
      },
    });

    // Use maps to get unique classes and subjects
    const kelasMap = new Map();
    const mapelMap = new Map();

    assignments.forEach(assignment => {
      if (assignment.kelas) {
        kelasMap.set(assignment.kelas.uuid, assignment.kelas);
      }
      if (assignment.mapel) {
        mapelMap.set(assignment.mapel.uuid, assignment.mapel);
      }
    });

    const uniqueKelas = Array.from(kelasMap.values());
    const uniqueMapel = Array.from(mapelMap.values());

    return NextResponse.json({
      kelas: uniqueKelas,
      mapel: uniqueMapel,
    });

  } catch (error: any) {
    console.error('Error fetching teaching assignments:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
