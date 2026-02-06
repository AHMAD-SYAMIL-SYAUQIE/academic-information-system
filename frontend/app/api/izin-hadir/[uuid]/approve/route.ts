import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const body = await request.json()
    const { guruUuid, catatanGuru } = body

    if (!guruUuid) {
      return NextResponse.json({ message: 'guruUuid required' }, { status: 400 })
    }

    // Get guru info
    const guru = await prisma.guru.findUnique({
      where: { uuid: guruUuid },
      select: { namaLengkap: true }
    })

    if (!guru) {
      return NextResponse.json({ message: 'Guru tidak ditemukan' }, { status: 404 })
    }

    // Get izin record with siswa and kelas info
    const izin = await prisma.izinHadir.findUnique({
      where: { uuid: params.uuid },
      include: {
        siswa: {
          include: {
            kelas: {
              select: {
                waliKelas: true
              }
            }
          }
        }
      }
    })

    if (!izin) {
      return NextResponse.json({ message: 'Izin tidak ditemukan' }, { status: 404 })
    }

    // Validate: Only wali kelas can approve
    const waliKelasNama = izin.siswa?.kelas?.waliKelas
    if (waliKelasNama !== guru.namaLengkap) {
      return NextResponse.json({ 
        message: 'Hanya wali kelas yang dapat menyetujui izin siswa!' 
      }, { status: 403 })
    }

    // Approve izin
    const updated = await prisma.izinHadir.update({
      where: { uuid: params.uuid },
      data: { 
        status: 'APPROVED', 
        guruUuid: guruUuid, 
        catatanGuru: catatanGuru || null 
      },
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error approve izin:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
