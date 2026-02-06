import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/auth/reset-password
// Reset password using OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, otp, password, confirmPassword } = body

    if (!identifier || !otp || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: 'Password dan konfirmasi password tidak cocok' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { admin: { email: identifier } },
          { guru: { OR: [{ nip: identifier }, { email: identifier }] } },
          { siswa: { OR: [{ nis: identifier }, { email: identifier }] } },
        ],
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Find valid OTP
    const otpRecord = await prisma.passwordResetOTP.findFirst({
      where: {
        userUuid: user.uuid,
        otp,
        isUsed: false,
        expiredAt: {
          gte: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!otpRecord) {
      return NextResponse.json(
        { message: 'Kode OTP tidak valid atau sudah kedaluwarsa' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and mark OTP as used
    await prisma.$transaction([
      prisma.user.update({
        where: { uuid: user.uuid },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetOTP.update({
        where: { uuid: otpRecord.uuid },
        data: { isUsed: true },
      }),
    ])

    return NextResponse.json({
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    })
  } catch (error: any) {
    console.error('Error reset password:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat reset password', error: error.message },
      { status: 500 }
    )
  }
}
