import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: { sesiAbsensiUuid: string } }
) {
  try {
    // Create a token and qrData
    const token = `qr-${randomUUID()}`
    const qrData = JSON.stringify({ token, sesi: params.sesiAbsensiUuid })

    // mark previous as expired
    await prisma.qRCode.updateMany({ where: { sesiAbsensiUuid: params.sesiAbsensiUuid, isExpired: false }, data: { isExpired: true } })

    const created = await prisma.qRCode.create({ data: { sesiAbsensiUuid: params.sesiAbsensiUuid, token, qrData, expiredAt: new Date(Date.now() + 1000 * 60 * 60) } })
    return NextResponse.json(created)
  } catch (error) {
    console.error('Error generate qr:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
