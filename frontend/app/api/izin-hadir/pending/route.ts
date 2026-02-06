import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const list = await prisma.izinHadir.findMany({ where: { status: 'PENDING' } })
    return NextResponse.json(list)
  } catch (error) {
    console.error('Error get pending izin-hadir:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
