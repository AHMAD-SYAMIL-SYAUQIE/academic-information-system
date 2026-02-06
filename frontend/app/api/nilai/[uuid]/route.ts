import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const body = await request.json()
    const updated = await prisma.nilai.update({ where: { uuid: params.uuid }, data: body })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error update nilai:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
