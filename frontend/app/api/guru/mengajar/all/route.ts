import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all assignments with guru/kelas/mapel details
export async function GET(request: NextRequest) {
  try {
    const assignments = await prisma.guruMengajarKelas.findMany({
      include: {
        guru: true,
        kelas: true,
        mapel: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

// POST new assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guruUuid, kelasUuid, mapelUuid } = body;

    if (!guruUuid || !kelasUuid || !mapelUuid) {
      return NextResponse.json(
        { message: 'guruUuid, kelasUuid, dan mapelUuid wajib diisi' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existing = await prisma.guruMengajarKelas.findFirst({
      where: {
        guruUuid,
        kelasUuid,
        mapelUuid,
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Assignment ini sudah ada' },
        { status: 400 }
      );
    }

    // Create legacy assignment
    const assignment = await prisma.guruMengajarKelas.create({
      data: {
        guruUuid,
        kelasUuid,
        mapelUuid,
      },
      include: {
        guru: true,
        kelas: true,
        mapel: true,
      },
    });

    // Also create TeachingAssignment for improved tracking
    const activeYear = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    });

    if (activeYear) {
      await prisma.teachingAssignment.create({
        data: {
          guruUuid,
          kelasUuid,
          mapelUuid,
          tahunAjaranUuid: activeYear.uuid,
          semester: activeYear.semester,
          isActive: true,
          isPrimary: true,
          jamPerMinggu: 4, // Default, bisa disesuaikan
        },
      });
    }

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
