import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const active = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    })
    return NextResponse.json(active)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
