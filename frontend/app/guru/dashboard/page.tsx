'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface DashboardStats {
  kelasCount: number
  siswaCount: number
  sesiAktif: number
  izinPending: number
  kehadiranHariIni: number
  totalAbsensiHariIni: number
}

interface RecentActivity {
  id: number
  type: 'absensi' | 'nilai' | 'izin' | 'qrcode'
  title: string
  description: string
  time: string
  status?: 'success' | 'warning' | 'info' | 'pending'
}

interface UpcomingSchedule {
  id: number
  kelas: string
  mapel: string
  jamMulai: string
  jamSelesai: string
  status: 'upcoming' | 'ongoing' | 'done'
}

export default function GuruDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, setUser } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    kelasCount: 0,
    siswaCount: 0,
    sesiAktif: 0,
    izinPending: 0,
    kehadiranHariIni: 0,
    totalAbsensiHariIni: 0,
  })
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [schedules, setSchedules] = useState<UpcomingSchedule[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  const fetchDashboardData = useCallback(async () => {
    // Use user.uuid directly if profile.uuid is not available
    const guruUuid = user?.profile?.uuid || user?.uuid;
    
    if (!guruUuid) {
      console.log('No UUID found for user:', user);
      return;
    }

    try {
      const res = await api.get(`/dashboard/guru?guruUuid=${guruUuid}`);
      const { stats, schedules, activities } = res.data;
      
      setStats(stats);
      setSchedules(schedules);
      setActivities(activities); // Will be empty for now as per API, but wired up.

    } catch (error: any) {
      console.error("Failed to fetch guru dashboard data", error);
      if (error.response?.status !== 400) {
        toast.error(error.response?.data?.message || "Gagal memuat data dashboard.");
      }
    }
  }, [user]);

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
      if (user.role !== 'GURU') {
        router.push('/login');
        return;
      }
      fetchDashboardData();
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [isAuthenticated, user, router, setUser, fetchDashboardData])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'absensi': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
      case 'nilai': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
      case 'izin': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
      case 'qrcode': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      )
      default: return null
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-100 text-emerald-600'
      case 'warning': return 'bg-amber-100 text-amber-600'
      case 'pending': return 'bg-orange-100 text-orange-600'
      case 'info': return 'bg-blue-100 text-blue-600'
      default: return 'bg-slate-100 text-slate-600'
    }
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
      <Sidebar role="GURU" />
      
      <div className="flex-1 ml-72 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Selamat Datang, {user?.username || 'Guru'}! 👋
              </h1>
              <p className="text-slate-500 mt-1">{formatDate(currentTime)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">Waktu Sekarang</p>
                <p className="text-2xl font-bold text-slate-800">{formatTime(currentTime)}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Kelas Mengajar */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Aktif</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.kelasCount}</h3>
            <p className="text-slate-500 text-sm">Kelas Mengajar</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => router.push('/guru/absensi')}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
              >
                Lihat Detail
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Total Siswa */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.siswaCount}</h3>
            <p className="text-slate-500 text-sm">Total Siswa</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => router.push('/guru/nilai')}
                className="text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center gap-1"
              >
                Input Nilai
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Kehadiran Hari Ini */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-violet-600 bg-violet-100 px-2 py-1 rounded-full">Hari Ini</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.kehadiranHariIni}%</h3>
            <p className="text-slate-500 text-sm">Kehadiran Hari Ini</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-violet-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats.kehadiranHariIni}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Izin Pending */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              {stats.izinPending > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                  Perlu Review
                </span>
              )}
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stats.izinPending}</h3>
            <p className="text-slate-500 text-sm">Izin Pending</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => router.push('/guru/izin')}
                className="text-amber-600 text-sm font-medium hover:text-amber-700 flex items-center gap-1"
              >
                Review Izin
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push('/guru/qr-code')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold">Generate QR</p>
              <p className="text-xs text-blue-100">Buat QR Absensi</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/guru/absensi')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold">Monitoring</p>
              <p className="text-xs text-emerald-100">Pantau Absensi</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/guru/nilai')}
            className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white p-4 rounded-2xl shadow-lg shadow-violet-500/30 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold">Input Nilai</p>
              <p className="text-xs text-violet-100">Kelola Nilai</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/guru/laporan')}
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white p-4 rounded-2xl shadow-lg shadow-rose-500/30 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold">Laporan</p>
              <p className="text-xs text-rose-100">Export Data</p>
            </div>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Today */}
          <div className="lg:col-span-1 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Jadwal Hari Ini</h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {schedules.length} Kelas
              </span>
            </div>
            
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div 
                  key={schedule.id}
                  className={`p-4 rounded-xl border-l-4 transition-all ${
                    schedule.status === 'ongoing' 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : schedule.status === 'done'
                      ? 'bg-slate-50 border-slate-300 opacity-60'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      schedule.status === 'ongoing' 
                        ? 'bg-blue-100 text-blue-600' 
                        : schedule.status === 'done'
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {schedule.status === 'ongoing' ? '🔴 Sedang Berlangsung' : schedule.status === 'done' ? '✓ Selesai' : '⏰ Akan Datang'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800">{schedule.kelas}</h3>
                  <p className="text-sm text-slate-500">{schedule.mapel}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {schedule.jamMulai} - {schedule.jamSelesai}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Aktivitas Terbaru</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Lihat Semua
              </button>
            </div>
            
            <div className="space-y-4">
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-800">{activity.title}</h3>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </div>
                    <p className="text-sm text-slate-500">{activity.description}</p>
                  </div>
                  {activity.status === 'pending' && (
                    <button 
                      onClick={() => router.push('/guru/izin')}
                      className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                    >
                      Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-lg font-bold mb-1">Ringkasan Hari Ini</h3>
              <p className="text-blue-100 text-sm">Data real-time kehadiran siswa</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.totalAbsensiHariIni}</p>
                <p className="text-xs text-blue-100">Siswa Hadir</p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.sesiAktif}</p>
                <p className="text-xs text-blue-100">Sesi Aktif</p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.kehadiranHariIni}%</p>
                <p className="text-xs text-blue-100">Tingkat Kehadiran</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
