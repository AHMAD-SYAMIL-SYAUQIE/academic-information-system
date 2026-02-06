import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username dan password wajib diisi' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        admin: true,
        guru: true,
        siswa: { include: { kelas: true } },
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Password salah' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Akun tidak aktif' },
        { status: 403 }
      )
    }

    let profile: Record<string, unknown> = {}
    if (user.role === 'ADMIN' && user.admin) {
      profile = {
        uuid: user.admin.uuid,
        namaLengkap: user.admin.namaLengkap,
        email: user.admin.email,
      }
    } else if (user.role === 'GURU' && user.guru) {
      profile = {
        uuid: user.guru.uuid,
        nip: user.guru.nip,
        namaLengkap: user.guru.namaLengkap,
        email: user.guru.email,
      }
    } else if (user.role === 'SISWA' && user.siswa) {
      profile = {
        uuid: user.siswa.uuid,
        nis: user.siswa.nis,
        namaLengkap: user.siswa.namaLengkap,
        kelas: user.siswa.kelas?.namaKelas,
      }
    }

    return NextResponse.json({
      accessToken: `token-${user.uuid}`,
      user: {
        uuid: user.uuid,
        username: user.username,
        role: user.role,
        profile,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}
