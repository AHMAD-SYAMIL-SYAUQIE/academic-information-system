'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface DashboardStats {
  kehadiranPersen: number
  totalAbsensi: number
  izinPending: number
  nilaiRataRata: number
}

interface RecentAbsensi {
  id: number
  mapel: string
  tanggal: string
  jam: string
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA'
}

interface RecentNilai {
  id: number
  mapel: string
  jenis: string
  nilai: number
  tanggal: string
}

interface PendingIzin {
  id: number
  jenis: string
  tanggal: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  keterangan: string
}

export default function SiswaDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, setUser } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState<DashboardStats>({
    kehadiranPersen: 0,
    totalAbsensi: 0,
    izinPending: 0,
    nilaiRataRata: 0,
  })
  const [recentAbsensi, setRecentAbsensi] = useState<RecentAbsensi[]>([])
  const [recentNilai, setRecentNilai] = useState<RecentNilai[]>([])
  const [pendingIzin, setPendingIzin] = useState<PendingIzin[]>([])

  const fetchDashboardData = useCallback(async () => {
    if (!user?.profile?.uuid) return

    try {
      const siswaUuid = user.profile.uuid
      
      const [absensiRes, nilaiRes, izinRes] = await Promise.all([
        api.get(`/absensi/riwayat?siswaUuid=${siswaUuid}&limit=4`),
        api.get(`/nilai/siswa/${siswaUuid}`),
        api.get(`/izin-hadir?siswaUuid=${siswaUuid}&status=PENDING`),
      ])

      // Process stats
      const allAbsensi = absensiRes.data.data || absensiRes.data || []
      const totalHadir = allAbsensi.filter((a: any) => a.status === 'HADIR').length
      const kehadiranPersen = allAbsensi.length > 0 ? Math.round((totalHadir / allAbsensi.length) * 100) : 0
      
      const allNilai = nilaiRes.data || []
      const totalNilai = allNilai.reduce((acc: number, n: any) => acc + n.nilai, 0)
      const nilaiRataRata = allNilai.length > 0 ? parseFloat((totalNilai / allNilai.length).toFixed(2)) : 0

      setStats({
        kehadiranPersen: kehadiranPersen,
        totalAbsensi: allAbsensi.length,
        izinPending: (izinRes.data && Array.isArray(izinRes.data)) ? izinRes.data.length : 0,
        nilaiRataRata: nilaiRataRata,
      })

      // Process recent lists
      setRecentAbsensi(allAbsensi.slice(0, 4).map((a: any) => ({
        id: a.uuid,
        mapel: a.sesiAbsensi?.mapel?.namaMapel || 'N/A',
        tanggal: new Date(a.scanTime).toLocaleDateString('id-ID'),
        jam: new Date(a.scanTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: a.status,
      })))
      
      setRecentNilai(allNilai.slice(0, 3).map((n: any) => ({
        id: n.uuid,
        mapel: n.mapel?.namaMapel || 'N/A',
        jenis: n.jenisNilai,
        nilai: n.nilai,
        tanggal: new Date(n.tanggal).toLocaleDateString('id-ID'),
      })))
      
      const izinData = Array.isArray(izinRes.data) ? izinRes.data : []
      setPendingIzin(izinData.map((i: any) => ({
        id: i.uuid || i.id,
        jenis: i.jenis,
        tanggal: i.tanggalMulai ? new Date(i.tanggalMulai).toLocaleDateString('id-ID') : new Date(i.tanggal).toLocaleDateString('id-ID'),
        status: i.status,
        keterangan: i.keterangan,
      })))

    } catch (error) {
      console.error("Failed to fetch dashboard data", error)
      toast.error('Gagal memuat data dashboard.')
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) {
      const local = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (local) {
        try {
          const parsed = JSON.parse(local)
          setUser(parsed, token || '')
        } catch {}
      }
    }

    if (!isAuthenticated && !localStorage.getItem('user')) {
      router.push('/login')
      return
    }

    if (user) {
      if (user.role !== 'SISWA') {
        router.push('/login')
        return
      }
      fetchDashboardData()
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [isAuthenticated, user, router, setUser, fetchDashboardData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HADIR': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'IZIN': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'SAKIT': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'ALFA': return 'bg-red-100 text-red-700 border-red-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getNilaiColor = (nilai: number) => {
    if (nilai >= 85) return 'text-emerald-600'
    if (nilai >= 70) return 'text-blue-600'
    if (nilai >= 55) return 'text-amber-600'
    return 'text-red-600'
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="SISWA" />
      
      <div className="flex-1 ml-72 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Halo, {user?.username || 'Siswa'}! 👋
              </h1>
              <p className="text-slate-500 mt-1">{formatDate(currentTime)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">Waktu Sekarang</p>
                <p className="text-2xl font-bold text-slate-800">{formatTime(currentTime)}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Kehadiran */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stats.kehadiranPersen >= 80 ? 'text-emerald-600 bg-emerald-100' : 'text-amber-600 bg-amber-100'}`}>
                {stats.kehadiranPersen >= 80 ? 'Bagus!' : 'Perlu Ditingkatkan'}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.kehadiranPersen}%</h3>
            <p className="text-slate-500 text-sm">Tingkat Kehadiran</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.kehadiranPersen}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Absensi */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Semester Ini</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.totalAbsensi}</h3>
            <p className="text-slate-500 text-sm">Total Absensi</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => router.push('/siswa/riwayat')}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
              >
                Lihat Riwayat
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Nilai Rata-rata */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stats.nilaiRataRata >= 80 ? 'text-violet-600 bg-violet-100' : 'text-amber-600 bg-amber-100'}`}>
                {stats.nilaiRataRata >= 80 ? 'Excellent!' : 'Good'}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.nilaiRataRata}</h3>
            <p className="text-slate-500 text-sm">Nilai Rata-rata</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => router.push('/siswa/nilai')}
                className="text-violet-600 text-sm font-medium hover:text-violet-700 flex items-center gap-1"
              >
                Lihat Nilai
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Izin Pending */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {stats.izinPending > 0 && (
                <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full animate-pulse">
                  {stats.izinPending} Pending
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.izinPending}</h3>
            <p className="text-slate-500 text-sm">Izin Pending</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => router.push('/siswa/izin')}
                className="text-amber-600 text-sm font-medium hover:text-amber-700 flex items-center gap-1"
              >
                Kelola Izin
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/siswa/scan-qr')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-5 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Scan QR Absensi</p>
              <p className="text-sm text-blue-100">Absen sekarang</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/siswa/izin')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-5 rounded-2xl shadow-lg shadow-amber-500/30 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Ajukan Izin</p>
              <p className="text-sm text-amber-100">Tidak bisa hadir?</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/siswa/riwayat')}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white p-5 rounded-2xl shadow-lg shadow-violet-500/30 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Riwayat Absensi</p>
              <p className="text-sm text-violet-100">Lihat semua</p>
            </div>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Absensi */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Riwayat Absensi Terkini</h2>
              <button 
                onClick={() => router.push('/siswa/riwayat')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Lihat Semua
              </button>
            </div>
            
            <div className="space-y-3">
              {recentAbsensi.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.mapel}</h3>
                      <p className="text-sm text-slate-500">{item.tanggal} • {item.jam}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Izin */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Status Izin</h2>
              <button 
                onClick={() => router.push('/siswa/izin')}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Kelola
              </button>
            </div>
            
            {pendingIzin.length > 0 ? (
              <div className="space-y-4">
                {pendingIzin.map((izin) => (
                  <div 
                    key={izin.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(izin.status)}`}>
                        {izin.status}
                      </span>
                      <span className="text-xs text-slate-500">{izin.tanggal}</span>
                    </div>
                    <h3 className="font-semibold text-slate-800">Izin {izin.jenis}</h3>
                    <p className="text-sm text-slate-500 mt-1">{izin.keterangan}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">Tidak ada izin pending</p>
              </div>
            )}
            
            <button
              onClick={() => router.push('/siswa/izin')}
              className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
            >
              + Ajukan Izin Baru
            </button>
          </div>
        </div>

        {/* Recent Nilai */}
        <div className="mt-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Nilai Terbaru</h2>
            <button 
              onClick={() => router.push('/siswa/nilai')}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Lihat Semua Nilai
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentNilai.map((item) => (
              <div 
                key={item.id}
                className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className={`text-3xl font-bold ${getNilaiColor(item.nilai)}`}>{item.nilai}</span>
                </div>
                <h3 className="font-semibold text-slate-800">{item.mapel}</h3>
                <p className="text-sm text-slate-500">{item.jenis} • {item.tanggal}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Banner */}
        <div className="mt-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">Tetap Semangat Belajar! 🚀</h3>
                <p className="text-emerald-100 text-sm">Jangan lupa absen dan kerjakan tugas tepat waktu</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.kehadiranPersen}%</p>
                <p className="text-xs text-emerald-100">Kehadiran</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.nilaiRataRata}</p>
                <p className="text-xs text-emerald-100">Rata-rata</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
