import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { uuid: params.uuid },
      include: {
        admin: true,
        guru: true,
        siswa: { include: { kelas: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const data = await request.json()

    // Handle deactivate/activate action
    if (data.action === 'deactivate') {
      const user = await prisma.user.update({
        where: { uuid: params.uuid },
        data: { isActive: false },
      })
      return NextResponse.json(user)
    }
    
    if (data.action === 'activate') {
      const user = await prisma.user.update({
        where: { uuid: params.uuid },
        data: { isActive: true },
      })
      return NextResponse.json(user)
    }

    // Handle general update (role change, dll)
    const updateData: any = {}
    
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.username !== undefined) updateData.username = data.username
    
    const user = await prisma.user.update({
      where: { uuid: params.uuid },
      data: updateData,
    })
    
    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    // Soft delete - set isActive to false
    const user = await prisma.user.update({
      where: { uuid: params.uuid },
      data: { isActive: false },
    })
    
    return NextResponse.json({ message: 'User berhasil dinonaktifkan', user })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 })
  }
}
