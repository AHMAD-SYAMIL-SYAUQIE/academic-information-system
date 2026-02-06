import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nilaiArray = body.nilai || body
    if (!Array.isArray(nilaiArray)) {
      return NextResponse.json({ message: 'Expected an array of nilai objects' }, { status: 400 })
    }

    const created = await prisma.nilai.createMany({ data: nilaiArray })
    return NextResponse.json(created)
  } catch (error) {
    console.error('Error create batch nilai:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
