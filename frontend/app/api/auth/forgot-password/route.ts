import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

// POST /api/auth/forgot-password
// Generate OTP and send to user's email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier } = body

    if (!identifier) {
      return NextResponse.json(
        { message: 'Username, NIS, NIP, atau email harus diisi' },
        { status: 400 }
      )
    }

    // Find user by username, NIS, NIP, or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { admin: { email: identifier } },
          { guru: { OR: [{ nip: identifier }, { email: identifier }] } },
          { siswa: { OR: [{ nis: identifier }, { email: identifier }] } },
        ],
      },
      include: {
        admin: true,
        guru: true,
        siswa: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get email based on role
    let email: string | null = null
    let namaLengkap = ''

    if (user.role === 'ADMIN' && user.admin) {
      email = user.admin.email
      namaLengkap = user.admin.namaLengkap
    } else if (user.role === 'GURU' && user.guru) {
      email = user.guru.email
      namaLengkap = user.guru.namaLengkap
    } else if (user.role === 'SISWA' && user.siswa) {
      email = user.siswa.email
      namaLengkap = user.siswa.namaLengkap
    }

    if (!email) {
      return NextResponse.json(
        { message: 'Email tidak ditemukan untuk user ini' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Expire in 5 minutes
    const expiredAt = new Date()
    expiredAt.setMinutes(expiredAt.getMinutes() + 5)

    // Save OTP to database
    await prisma.passwordResetOTP.create({
      data: {
        userUuid: user.uuid,
        otp,
        expiredAt,
      },
    })

    // Check SMTP configuration
    const smtpUser = process.env.SMTP_USER?.trim()
    const smtpPass = process.env.SMTP_PASS?.trim()
    const isDevelopment = !smtpUser || !smtpPass || smtpUser === 'emailkamu@gmail.com'
    
    console.log('🔍 SMTP Check:', {
      user: smtpUser ? '✅ TERISI' : '❌ KOSONG',
      pass: smtpPass ? '✅ TERISI' : '❌ KOSONG',
      mode: isDevelopment ? '⚠️  DEV MODE' : '✅ PRODUCTION MODE'
    })
    
    if (isDevelopment) {
      console.log('\n🔐 ================================')
      console.log('   DEVELOPMENT MODE - OTP EMAIL')
      console.log('   ⚠️  SMTP belum dikonfigurasi!')
      console.log('   ================================')
      console.log('   Username:', user.username)
      console.log('   Role:', user.role)
      console.log('   Email:', email)
      console.log('   OTP:', otp)
      console.log('   Expires:', expiredAt.toLocaleString('id-ID'))
      console.log('   ================================\n')
      
      return NextResponse.json({
        message: 'OTP berhasil dikirim! (Development Mode - Cek console server)',
        email: email,
        devMode: true,
        // Show OTP in response (DEV ONLY!)
        otp: otp,
      })
    }

    // Production mode: Send email using Nodemailer
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '465') === 465, // SSL/TLS encryption
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
      from: `"Sistem Akademik MAN 19" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Kode OTP Reset Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Reset Password - Sistem Akademik</h2>
          <p>Halo <strong>${namaLengkap}</strong>,</p>
          <p>Anda telah meminta untuk mereset password akun Anda.</p>
          <p>Gunakan kode OTP berikut untuk melanjutkan proses reset password:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1e40af; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p><strong>Kode OTP ini berlaku selama 5 menit.</strong></p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">
            Email ini dikirim otomatis. Mohon tidak membalas email ini.
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      message: 'Kode OTP telah dikirim ke email Anda',
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
    })
    
    } catch (emailError: any) {
      console.error('❌ Email send failed:', emailError.message)
      
      // Jika email gagal, tetap return success dengan OTP (development fallback)
      console.log('\n⚠️  EMAIL GAGAL - FALLBACK MODE')
      console.log('   OTP:', otp)
      console.log('   User:', user.username)
      console.log('   Email:', email, '\n')
      
      return NextResponse.json({
        message: 'Email gagal dikirim. OTP dapat dilihat di console server.',
        email: email,
        devMode: true,
        otp: otp,
        warning: 'SMTP tidak dikonfigurasi dengan benar. Gunakan App Password Gmail.'
      })
    }
    
  } catch (error: any) {
    console.error('Error forgot password:', error)
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat mengirim OTP', error: error.message },
      { status: 500 }
    )
  }
}
