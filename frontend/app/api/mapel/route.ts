import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const mapel = await prisma.mapel.findMany({
      include: { tahunAjaran: true },
      orderBy: { namaMapel: 'asc' },
    })
    return NextResponse.json(mapel)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    let tahunAjaranUuid = data.tahunAjaranUuid
    if (!tahunAjaranUuid) {
      const active = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })
      if (!active) {
        return NextResponse.json({ message: 'Tidak ada tahun ajaran aktif' }, { status: 400 })
      }
      tahunAjaranUuid = active.uuid
    }

    const mapel = await prisma.mapel.create({
      data: {
        kodeMapel: data.kodeMapel,
        namaMapel: data.namaMapel,
        deskripsi: data.deskripsi || null,
        tahunAjaranUuid,
      },
    })
    return NextResponse.json(mapel)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
