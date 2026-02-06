import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tahunAjaran = await prisma.tahunAjaran.findMany({
      orderBy: { tahun: 'desc' },
    })
    return NextResponse.json(tahunAjaran)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  try {

    // --- DETAILED VALIDATION BLOCK ---
    const { tahun, semester, tanggalMulai, tanggalSelesai } = data

    if (!tahun || typeof tahun !== 'string' || tahun.trim() === '') {
      return NextResponse.json({ message: 'Field "tahun" wajib diisi dan harus berupa teks.' }, { status: 400 })
    }
    if (!semester || !['GANJIL', 'GENAP'].includes(semester.toUpperCase())) {
      return NextResponse.json({ message: 'Field "semester" wajib diisi dan harus bernilai "GANJIL" atau "GENAP".' }, { status: 400 })
    }
    if (!tanggalMulai) {
      return NextResponse.json({ message: 'Field "tanggalMulai" wajib diisi.' }, { status: 400 })
    }
    if (!tanggalSelesai) {
      return NextResponse.json({ message: 'Field "tanggalSelesai" wajib diisi.' }, { status: 400 })
    }
    if (isNaN(new Date(tanggalMulai).getTime())) {
      return NextResponse.json({ message: 'Format "tanggalMulai" tidak valid' }, { status: 400 })
    }
    if (isNaN(new Date(tanggalSelesai).getTime())) {
      return NextResponse.json({ message: 'Format "tanggalSelesai" tidak valid' }, { status: 400 })
    }
    // --- END DETAILED VALIDATION BLOCK ---

    // Map semester string to integer
    const semesterInt = semester.toUpperCase() === 'GANJIL' ? 1 : 2;

    const tahunAjaran = await prisma.tahunAjaran.create({
      data: {
        tahun: data.tahun,
        semester: semesterInt,
        tanggalMulai: new Date(data.tanggalMulai),
        tanggalSelesai: new Date(data.tanggalSelesai),
        isActive: data.isActive || false,
      },
    })
    return NextResponse.json(tahunAjaran)
  } catch (error) {
    // Unique constraint error
    if (error instanceof Error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { message: `Tahun ajaran "${data.tahun}" sudah ada.` },
        { status: 409 } // 409 Conflict
      )
    }
    
    console.error('Error creating tahun ajaran:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
