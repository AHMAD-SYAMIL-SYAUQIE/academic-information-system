import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const mapel = await prisma.mapel.findUnique({
      where: { uuid: params.uuid },
      include: { tahunAjaran: true },
    })
    if (!mapel) {
      return NextResponse.json({ message: 'Mapel tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(mapel)
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
    const mapel = await prisma.mapel.update({
      where: { uuid: params.uuid },
      data: {
        kodeMapel: data.kodeMapel,
        namaMapel: data.namaMapel,
        deskripsi: data.deskripsi || null,
      },
    })
    return NextResponse.json(mapel)
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
    await prisma.mapel.delete({ where: { uuid: params.uuid } })
    return NextResponse.json({ message: 'Mapel berhasil dihapus' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
