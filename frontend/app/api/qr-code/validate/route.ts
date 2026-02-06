import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = body.token
    if (!token) return NextResponse.json({ message: 'token required' }, { status: 400 })

    const record = await prisma.qRCode.findUnique({ where: { token } })
    if (!record) return NextResponse.json({ valid: false, message: 'Invalid token' })
    if (record.isExpired || new Date(record.expiredAt) < new Date()) {
      return NextResponse.json({ valid: false, message: 'Expired' })
    }

    return NextResponse.json({ valid: true, sesiAbsensiUuid: record.sesiAbsensiUuid })
  } catch (error) {
    console.error('Error validate qr:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
