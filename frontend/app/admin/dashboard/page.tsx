'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, logout, isAuthenticated, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try lightweight rehydrate from localStorage if zustand persist hasn't finished
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

    if (user && user.role !== 'ADMIN') {
      router.push('/login')
      return
    }

    if (user && user.role === 'ADMIN') setLoading(false)
  }, [isAuthenticated, user, router, setUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="ADMIN" />
      
      <div className="flex-1 ml-72">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-slate-600 mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Selamat datang, <span className="font-semibold">{user?.username}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-2.5 rounded-xl border border-primary-200/50">
                  <p className="text-xs text-primary-700 font-medium">Tahun Ajaran</p>
                  <p className="font-bold text-primary-900">2024/2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm font-semibold tracking-wide uppercase">Total Siswa</p>
                    <h3 className="text-5xl font-bold text-white mt-2 tracking-tight">150</h3>
                    <p className="text-blue-100 text-xs mt-2 font-medium">+12 dari bulan lalu</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3.5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="h-1.5 bg-blue-400/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white/50 rounded-full w-[78%]"></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-emerald-100 text-sm font-semibold tracking-wide uppercase">Total Guru</p>
                    <h3 className="text-5xl font-bold text-white mt-2 tracking-tight">25</h3>
                    <p className="text-emerald-100 text-xs mt-2 font-medium">5 guru senior</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3.5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="h-1.5 bg-emerald-400/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white/50 rounded-full w-full"></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-purple-100 text-sm font-semibold tracking-wide uppercase">Total Kelas</p>
                    <h3 className="text-5xl font-bold text-white mt-2 tracking-tight">12</h3>
                    <p className="text-purple-100 text-xs mt-2 font-medium">Kelas X - XII</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3.5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="h-1.5 bg-purple-400/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white/50 rounded-full w-[60%]"></div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-orange-100 text-sm font-semibold tracking-wide uppercase">Kehadiran</p>
                    <h3 className="text-5xl font-bold text-white mt-2 tracking-tight">92%</h3>
                    <p className="text-orange-100 text-xs mt-2 font-medium">138/150 siswa hadir</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3.5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="h-1.5 bg-orange-400/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white/50 rounded-full w-[92%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Akses Cepat</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { path: '/admin/users', color: 'primary', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Kelola Users' },
                  { path: '/admin/sesi-absensi', color: 'emerald', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Sesi Absensi' },
                  { path: '/admin/kelas', color: 'purple', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label: 'Kelola Kelas' },
                  { path: '/admin/laporan', color: 'amber', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Laporan' },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-${item.color}-50 hover:to-${item.color}-100 rounded-xl border border-slate-200/60 hover:border-${item.color}-300 transition-all duration-200 group hover:shadow-md`}
                  >
                    <div className="bg-white p-2.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                      <svg className={`w-5 h-5 text-${item.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <span className="font-semibold text-xs text-slate-700">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Aktivitas Terbaru</h2>
              </div>
              <div className="space-y-4">
                {[
                  { color: 'blue', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z', title: 'QR Code Generated', desc: 'Sesi Matematika - Kelas 10 IPA 1', time: '5 menit yang lalu' },
                  { color: 'green', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Sesi Ditutup', desc: '142/150 siswa hadir (94.7%)', time: '1 jam yang lalu' },
                  { color: 'purple', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', title: 'Siswa Baru', desc: '3 siswa ditambahkan ke 10 IPA 2', time: '2 jam yang lalu' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 bg-gradient-to-br from-${activity.color}-100 to-${activity.color}-200 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                        <svg className={`w-5 h-5 text-${activity.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activity.icon} />
                        </svg>
                      </div>
                      {idx < 2 && <div className={`w-0.5 h-full bg-gradient-to-b from-${activity.color}-200 to-transparent mt-2`}></div>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm">{activity.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{activity.desc}</p>
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
