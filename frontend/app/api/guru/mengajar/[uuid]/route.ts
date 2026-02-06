import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { uuid } = params;

    // Delete from GuruMengajarKelas
    const deleted = await prisma.guruMengajarKelas.delete({
      where: { uuid },
    });

    // Also delete from TeachingAssignment if exists
    await prisma.teachingAssignment.deleteMany({
      where: {
        guruUuid: deleted.guruUuid,
        kelasUuid: deleted.kelasUuid,
        mapelUuid: deleted.mapelUuid,
      },
    });

    return NextResponse.json({ message: 'Assignment berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
