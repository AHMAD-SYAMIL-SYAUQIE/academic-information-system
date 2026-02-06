import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const record = await prisma.izinHadir.findUnique({ where: { uuid: params.uuid } })
    if (!record) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error get izin by id:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    await prisma.izinHadir.delete({ where: { uuid: params.uuid } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('Error delete izin:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
