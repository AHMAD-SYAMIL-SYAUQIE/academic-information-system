import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const query = Object.fromEntries(url.searchParams)

    const where: any = {}
    if (query.status) where.status = query.status
    if (query.siswaUuid) where.siswaUuid = query.siswaUuid
    
    // If guruUuid provided, filter by wali kelas
    if (query.guruUuid) {
      // Get guru nama first
      const guru = await prisma.guru.findUnique({
        where: { uuid: query.guruUuid },
        select: { namaLengkap: true }
      })
      
      if (guru) {
        where.siswa = {
          kelas: {
            waliKelas: guru.namaLengkap
          }
        }
      }
    }

    const list = await prisma.izinHadir.findMany({ 
      where,
      include: {
        siswa: {
          select: {
            user: {
              select: {
                username: true
              }
            },
            kelas: {
              select: {
                namaKelas: true
              }
            }
          }
        },
        guru: {
          select: {
            namaLengkap: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Transform data to include guru name
    const transformed = list.map(item => ({
      id: item.uuid,
      uuid: item.uuid,
      siswaUsername: item.siswa?.user?.username || 'N/A',
      kelasNama: item.siswa?.kelas?.namaKelas || 'N/A',
      tanggalMulai: item.tanggal,
      tanggalSelesai: item.tanggal,
      jenis: item.jenis,
      keterangan: item.keterangan,
      buktiFile: item.bukti,
      status: item.status,
      createdAt: item.createdAt,
      approvedBy: item.guru ? { namaGuru: item.guru.namaLengkap } : null
    }))
    
    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error get izin-hadir:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user (assuming Siswa role)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer token-')) {
      return NextResponse.json({ message: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const userUuid = authHeader.substring('Bearer token-'.length);
    const user = await prisma.user.findUnique({ where: { uuid: userUuid }, include: { siswa: true } });

    if (!user || !user.siswa) {
      return NextResponse.json({ message: 'Forbidden: No student profile found for this user' }, { status: 403 });
    }
    const siswaUuid = user.siswa.uuid;

    // 2. Get data from body
    const body = await request.json();
    const { jenis, keterangan, bukti, tanggalMulai, tanggalSelesai } = body;

    if (!jenis || !keterangan || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json({ message: 'Field jenis, keterangan, tanggalMulai, dan tanggalSelesai wajib diisi.' }, { status: 400 });
    }
    
    // 3. Loop through date range and prepare records
    const startDate = new Date(tanggalMulai);
    const endDate = new Date(tanggalSelesai);
    const recordsToCreate = [];
    
    let currentDate = new Date(startDate.toISOString().split('T')[0]);

    while (currentDate <= endDate) {
      recordsToCreate.push({
        siswaUuid: siswaUuid,
        jenis: jenis,
        keterangan: keterangan,
        bukti: bukti || null,
        tanggal: new Date(currentDate), // Set the mandatory 'tanggal' field
      });
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 4. Create records in the database
    if (recordsToCreate.length === 0) {
      return NextResponse.json({ message: 'Tanggal mulai harus sebelum atau sama dengan tanggal selesai.' }, { status: 400 });
    }

    const result = await prisma.izinHadir.createMany({
      data: recordsToCreate,
      skipDuplicates: true, // Optional: prevent errors if a record for a day already exists
    });

    return NextResponse.json({ message: `Berhasil membuat ${result.count} data izin/sakit.` });

  } catch (error) {
    console.error('Error create izin-hadir:', error);
    // Check for Prisma specific errors if needed
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
       return NextResponse.json({ message: 'Gagal: Anda sudah mengajukan izin pada salah satu tanggal di rentang tersebut.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
