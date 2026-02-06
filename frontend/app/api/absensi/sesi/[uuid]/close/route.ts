import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const updated = await prisma.sesiAbsensi.update({
      where: { uuid: params.uuid },
      data: { status: 'CLOSED' },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error close sesi:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
