import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userUuid = url.searchParams.get('userUuid')
    if (!userUuid) return NextResponse.json({ message: 'userUuid required' }, { status: 400 })

    // Find siswa by userUuid
    const siswa = await prisma.siswa.findUnique({ where: { userUuid } })
    if (!siswa) return NextResponse.json({ message: 'Siswa tidak ditemukan' }, { status: 404 })

    const records = await prisma.izinHadir.findMany({ where: { siswaUuid: siswa.uuid } })
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error get my siswa izin:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
