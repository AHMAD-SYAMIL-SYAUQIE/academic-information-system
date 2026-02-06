import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import qrcode from 'qrcode'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const page = parseInt(url.searchParams.get('page') || '1')
    const guruUuid = url.searchParams.get('guruUuid')
    const status = url.searchParams.get('status')

    const where: any = {}
    if (guruUuid) where.guruUuid = guruUuid
    if (status) where.status = status as any

    const sesi = await prisma.sesiAbsensi.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        kelas: true,
        mapel: true,
        guru: { include: { user: true } },
        qrCode: true, // FIXED: Include QRCode data
      },
      orderBy: { tanggal: 'desc' },
    })

    return NextResponse.json(sesi)
  } catch (error) {
    console.error('Error get sesi:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kelasUuid, mapelUuid, tanggal, jamMulai, jamSelesai, guruUuid, skipValidation } = body

    // --- VALIDATION BLOCK ---
    if (!kelasUuid || !mapelUuid || !tanggal || !jamMulai || !jamSelesai || !guruUuid) {
      return NextResponse.json(
        { message: 'Semua field (termasuk guruUuid) wajib diisi' },
        { status: 400 }
      )
    }

    // NEW: Validate TeachingAssignment (optional, for improved authorization)
    if (!skipValidation) {
      const activeYear = await prisma.tahunAjaran.findFirst({
        where: { isActive: true },
      });

      if (activeYear) {
        const assignment = await prisma.teachingAssignment.findFirst({
          where: {
            guruUuid,
            kelasUuid,
            mapelUuid,
            tahunAjaranUuid: activeYear.uuid,
            semester: activeYear.semester,
            isActive: true,
            endedAt: null,
          },
        });

        if (!assignment) {
          // Check legacy GuruMengajarKelas for backward compatibility
          const legacyAssignment = await prisma.guruMengajarKelas.findFirst({
            where: { guruUuid, kelasUuid, mapelUuid },
          });

          if (!legacyAssignment) {
            return NextResponse.json(
              { message: 'Guru tidak memiliki assignment untuk kelas dan mapel ini' },
              { status: 403 }
            );
          }
        }
      }
    }
    // --- END VALIDATION BLOCK ---

    const result = await prisma.$transaction(async (tx) => {
      // NEW: Try to link to TeachingAssignment
      let teachingAssignmentUuid = null;
      let tahunAjaranUuid = null;
      
      const activeYear = await tx.tahunAjaran.findFirst({
        where: { isActive: true },
      });

      if (activeYear) {
        tahunAjaranUuid = activeYear.uuid;
        const assignment = await tx.teachingAssignment.findFirst({
          where: {
            guruUuid,
            kelasUuid,
            mapelUuid,
            tahunAjaranUuid: activeYear.uuid,
            semester: activeYear.semester,
            isActive: true,
          },
        });
        if (assignment) teachingAssignmentUuid = assignment.uuid;
      }

      // 1. Create the SesiAbsensi
      const sesi = await tx.sesiAbsensi.create({
        data: {
          kelasUuid,
          mapelUuid,
          guruUuid,
          tanggal: new Date(tanggal),
          jamMulai,
          jamSelesai,
          status: 'ACTIVE',
          tahunAjaranUuid, // Link to active academic year
          teachingAssignmentUuid, // NEW: Link to assignment if found
        }
      })

      // 2. Generate a unique token
      const token = randomBytes(32).toString('hex')

      // 3. Set expiration time
      const [hours, minutes] = jamSelesai.split(':')
      const expiredAt = new Date(tanggal)
      expiredAt.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // 4. Generate QR code data URL
      const qrCodePayload = JSON.stringify({ token, sesiUuid: sesi.uuid })
      const qrDataUrl = await qrcode.toDataURL(qrCodePayload)

      // 5. Create the QRCode record
      const qrCode = await tx.qRCode.create({
        data: {
          sesiAbsensiUuid: sesi.uuid,
          token,
          qrData: qrDataUrl,
          expiredAt,
        }
      })

      return { ...sesi, qrCode: [qrCode] } // Return qrCode in an array to match relation
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error create sesi:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
