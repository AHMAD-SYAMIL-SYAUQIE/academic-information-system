'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default function AdminAturanPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') router.push('/login')
  }, [isAuthenticated, user, router])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="ADMIN" />
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6"><h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Aturan Akademik</h1><p className="text-slate-600 mt-1.5">Konfigurasi bobot nilai dan aturan absensi</p></div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Bobot Nilai</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"><span className="font-medium text-slate-700">Tugas</span><span className="text-2xl font-bold text-primary-600">20%</span></div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"><span className="font-medium text-slate-700">Ulangan Harian</span><span className="text-2xl font-bold text-primary-600">20%</span></div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"><span className="font-medium text-slate-700">UTS</span><span className="text-2xl font-bold text-primary-600">30%</span></div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"><span className="font-medium text-slate-700">UAS</span><span className="text-2xl font-bold text-primary-600">30%</span></div>
              </div>
              <p className="text-sm text-slate-500 mt-4">* Rumus: (Tugas×0.2) + (UH×0.2) + (UTS×0.3) + (UAS×0.3)</p>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Aturan Absensi</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"><span className="font-medium text-slate-700">QR Code Refresh</span><span className="text-lg font-bold text-blue-600">60 detik</span></div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"><span className="font-medium text-slate-700">QR Code Expiry</span><span className="text-lg font-bold text-blue-600">120 detik</span></div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"><span className="font-medium text-slate-700">GPS Radius</span><span className="text-lg font-bold text-blue-600">50 meter</span></div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl"><span className="font-medium text-slate-700">Lokasi Sekolah</span><span className="text-sm font-medium text-slate-600">-6.200, 106.816</span></div>
              </div>
              <p className="text-sm text-slate-500 mt-4">* Konfigurasi dapat diubah di file .env backend</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
