import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const kelas = await prisma.kelas.findUnique({
      where: { uuid: params.uuid },
      include: { tahunAjaran: true, siswa: true },
    })
    if (!kelas) {
      return NextResponse.json({ message: 'Kelas tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json(kelas)
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
    const kelas = await prisma.kelas.update({
      where: { uuid: params.uuid },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    await prisma.kelas.delete({ where: { uuid: params.uuid } })
    return NextResponse.json({ message: 'Kelas berhasil dihapus' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
