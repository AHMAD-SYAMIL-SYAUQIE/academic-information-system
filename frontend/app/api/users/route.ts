import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = { deletedAt: null }
    if (role) where.role = role
    if (isActive !== null) where.isActive = isActive === 'true'

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const total = await prisma.user.count({ where })

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      include: {
        admin: true,
        guru: true,
        siswa: { include: { kelas: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // --- VALIDATION BLOCK ---
    const { role, username, password, namaLengkap, email, nip, nis, kelasUuid, jenisKelamin } = data

    if (!role || !username || !password || !namaLengkap) {
      return NextResponse.json({ message: 'Role, Username, Password, dan Nama Lengkap wajib diisi.' }, { status: 400 })
    }

    if (role === 'GURU' && !nip) {
      return NextResponse.json({ message: 'NIP wajib diisi untuk role Guru.' }, { status: 400 })
    }

    if (role === 'SISWA' && (!nis || !kelasUuid)) {
      return NextResponse.json({ message: 'NIS dan Kelas wajib diisi untuk role Siswa.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    })
    if (existing) {
      return NextResponse.json({ message: 'Username sudah digunakan' }, { status: 409 })
    }
    // --- END VALIDATION BLOCK ---
    
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Map frontend 'L'/'P' to Prisma Enum 'LAKI_LAKI'/'PEREMPUAN'
    const genderEnum = jenisKelamin === 'L' ? 'LAKI_LAKI' : 'PEREMPUAN'

    let user
    if (data.role === 'ADMIN') {
      user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          role: 'ADMIN',
          admin: {
            create: {
              namaLengkap: data.namaLengkap,
              email: data.email,
              noTelp: data.noTelp,
            },
          },
        },
        include: { admin: true },
      })
    } else if (data.role === 'GURU') {
      user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          role: 'GURU',
          guru: {
            create: {
              nip: data.nip,
              namaLengkap: data.namaLengkap,
              jenisKelamin: genderEnum,
              email: data.email,
              noTelp: data.noTelp,
              alamat: data.alamat,
              tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
            },
          },
        },
        include: { guru: true },
      })
    } else if (data.role === 'SISWA') {
      user = await prisma.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          role: 'SISWA',
          siswa: {
            create: {
              nis: data.nis,
              namaLengkap: data.namaLengkap,
              jenisKelamin: genderEnum,
              kelasUuid: data.kelasUuid,
              email: data.email,
              noTelp: data.noTelp,
              alamat: data.alamat,
              tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
              namaWali: data.namaWali,
              noTelpWali: data.noTelpWali,
            },
          },
        },
        include: { siswa: { include: { kelas: true } } },
      })
    } else {
        return NextResponse.json({ message: 'Role tidak valid.' }, { status: 400 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan pada server saat membuat user.' }, { status: 500 })
  }
}
