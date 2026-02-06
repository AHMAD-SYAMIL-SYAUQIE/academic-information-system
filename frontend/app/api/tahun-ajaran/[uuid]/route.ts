import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const tahunAjaran = await prisma.tahunAjaran.findUnique({
      where: { uuid: params.uuid },
    })
    if (!tahunAjaran) {
      return NextResponse.json({ message: 'Tahun ajaran tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(tahunAjaran)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const data = await request.json()

    if (data.action === 'activate') {
      // Use a transaction to ensure both operations succeed or fail together
      const transactionResult = await prisma.$transaction([
        // 1. Deactivate all other academic years
        prisma.tahunAjaran.updateMany({
          data: { isActive: false },
        }),
        // 2. Activate the target academic year
        prisma.tahunAjaran.update({
          where: { uuid: params.uuid },
          data: { isActive: true },
        }),
      ]);
      // Return the result of the second operation (the updated academic year)
      return NextResponse.json(transactionResult[1]);
    }

    const tahunAjaran = await prisma.tahunAjaran.update({
      where: { uuid: params.uuid },
      data: {
        tahun: data.tahun,
        semester: parseInt(data.semester),
        tanggalMulai: new Date(data.tanggalMulai),
        tanggalSelesai: new Date(data.tanggalSelesai),
      },
    })
    return NextResponse.json(tahunAjaran)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    await prisma.tahunAjaran.delete({ where: { uuid: params.uuid } })
    return NextResponse.json({ message: 'Tahun ajaran berhasil dihapus' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
