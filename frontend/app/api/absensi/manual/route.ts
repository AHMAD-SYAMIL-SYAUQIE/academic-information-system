import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/absensi/manual
// Create manual absensi for students who haven't scanned QR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sesiAbsensiUuid, siswaUuid, status, keterangan } = body

    if (!sesiAbsensiUuid || !siswaUuid || !status) {
      return NextResponse.json(
        { message: 'sesiAbsensiUuid, siswaUuid, dan status wajib diisi' },
        { status: 400 }
      )
    }

    // Validate sesi exists
    const sesi = await prisma.sesiAbsensi.findUnique({
      where: { uuid: sesiAbsensiUuid },
    })

    if (!sesi) {
      return NextResponse.json({ message: 'Sesi tidak ditemukan' }, { status: 404 })
    }

    // Validate siswa exists and is in the correct class
    const siswa = await prisma.siswa.findUnique({
      where: { uuid: siswaUuid },
    })

    if (!siswa) {
      return NextResponse.json({ message: 'Siswa tidak ditemukan' }, { status: 404 })
    }

    if (siswa.kelasUuid !== sesi.kelasUuid) {
      return NextResponse.json(
        { message: 'Siswa tidak terdaftar di kelas ini' },
        { status: 400 }
      )
    }

    // Check if already has absensi
    const existing = await prisma.absensi.findFirst({
      where: {
        sesiAbsensiUuid,
        siswaUuid,
      },
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Siswa sudah memiliki record absensi. Gunakan update untuk mengubah status.' },
        { status: 400 }
      )
    }

    // Create manual absensi
    const absensi = await prisma.absensi.create({
      data: {
        sesiAbsensiUuid,
        siswaUuid,
        status,
        keterangan: keterangan || 'Absensi manual oleh guru',
        scanTime: new Date(), // Use current time as scan time
        // isManual: true, // TODO: Uncomment after prisma generate success
      },
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
        sesiAbsensi: {
          include: {
            kelas: true,
            mapel: true,
          },
        },
      },
    })

    return NextResponse.json(absensi, { status: 201 })
  } catch (error: any) {
    console.error('Error creating manual absensi:', error)
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    )
  }
}
