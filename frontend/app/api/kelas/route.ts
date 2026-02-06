import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const kelas = await prisma.kelas.findMany({
      include: {
        tahunAjaran: true,
        _count: { select: { siswa: true } },
      },
      orderBy: { namaKelas: 'asc' },
    })
    return NextResponse.json(kelas)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // --- VALIDATION BLOCK ---
    const { namaKelas, tingkat, tahunAjaranUuid } = data
    if (!namaKelas || !tingkat || !tahunAjaranUuid) {
      return NextResponse.json(
        { message: 'Field namaKelas, tingkat, dan tahunAjaranUuid wajib diisi' },
        { status: 400 }
      )
    }
    // --- END VALIDATION BLOCK ---

    const kelas = await prisma.kelas.create({
      data: {
        namaKelas: data.namaKelas,
        tingkat: parseInt(data.tingkat),
        jurusan: data.jurusan || null,
        waliKelas: data.waliKelas || null,
        tahunAjaranUuid: data.tahunAjaranUuid,
      },
    })
    return NextResponse.json(kelas)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
