import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const siswaUuid = url.searchParams.get('siswaUuid')
    const filter = url.searchParams.get('filter') || 'month'
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    if (!siswaUuid) {
      return NextResponse.json({ message: 'siswaUuid query param required' }, { status: 400 })
    }

    // Calculate date range based on filter
    const now = new Date()
    let startDate = new Date()
    
    switch (filter) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'semester':
        startDate.setMonth(now.getMonth() - 6)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    const where = {
      siswaUuid,
      sesiAbsensi: {
        tanggal: {
          gte: startDate,
          lte: now
        }
      }
    }

    // Get total count
    const total = await prisma.absensi.count({ where })
    
    // Get paginated records
    const skip = (page - 1) * limit
    const records = await prisma.absensi.findMany({
      where,
      include: { 
        sesiAbsensi: {
          include: {
            mapel: true,
            guru: {
              select: {
                namaLengkap: true
              }
            }
          }
        }
      },
      orderBy: { scanTime: 'desc' },
      skip,
      take: limit,
    })

    // Calculate statistics
    const allRecords = await prisma.absensi.findMany({
      where,
      select: { status: true }
    })
    
    const stats = {
      hadir: allRecords.filter(r => r.status === 'HADIR').length,
      izin: allRecords.filter(r => r.status === 'IZIN').length,
      sakit: allRecords.filter(r => r.status === 'SAKIT').length,
      alpha: allRecords.filter(r => r.status === 'ALPHA').length,
      terlambat: allRecords.filter(r => r.status === 'TERLAMBAT').length,
      total: allRecords.length
    }

    return NextResponse.json({
      data: records,
      statistik: stats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error riwayat absensi:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
