import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userUuid = url.searchParams.get('userUuid')
    if (!userUuid) return NextResponse.json({ message: 'userUuid required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { uuid: userUuid }, include: { admin: true, guru: true, siswa: true } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error auth profile:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
