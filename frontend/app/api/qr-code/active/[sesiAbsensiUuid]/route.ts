import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { sesiAbsensiUuid: string } }
) {
  try {
    const record = await prisma.qRCode.findFirst({ where: { sesiAbsensiUuid: params.sesiAbsensiUuid, isExpired: false }, orderBy: { createdAt: 'desc' } })
    if (!record) return NextResponse.json({ message: 'No active QR' }, { status: 404 })
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error get active qr:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
