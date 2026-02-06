'use client'

import { useAuthStore } from '@/lib/auth'
import api from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface Riwayat {
  uuid: string
  scanTime: string
  status: string
  keterangan: string | null
  sesiAbsensi: {
    tanggal: string
    waktuMulai: string
    waktuSelesai: string
    mapel: {
      namaMapel: string
      guru: {
        user: {
          nama: string
        }
      }
    }
  }
}

interface Stats {
  hadir: number
  izin: number
  sakit: number
  alpha: number
  terlambat: number
}

export default function RiwayatAbsensi() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [riwayat, setRiwayat] = useState<Riwayat[]>([])
  const [stats, setStats] = useState<Stats>({
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpha: 0,
    terlambat: 0,
  })
  const [filter, setFilter] = useState('week')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [perPage, setPerPage] = useState(10)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (user?.profile?.uuid) {
      setCurrentPage(1) // Reset to page 1 when filter changes
    }
  }, [filter, user])

  useEffect(() => {
    if (user?.profile?.uuid) {
      fetchRiwayat()
    }
  }, [user, filter, currentPage, perPage])

  const fetchRiwayat = async () => {
    setLoading(true)
    try {
      const siswaUuid = user?.profile?.uuid
      const response = await api.get(
        `/absensi/riwayat?siswaUuid=${siswaUuid}&filter=${filter}&page=${currentPage}&limit=${perPage}`
      )
      
      if (response.data) {
        setRiwayat(response.data.data || [])
        setStats(response.data.statistik || {
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0,
          terlambat: 0,
        })
        setTotalRecords(response.data.total || 0)
        setTotalPages(response.data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching riwayat:', error)
      toast.error('Gagal memuat riwayat absensi')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      HADIR: 'bg-green-100 text-green-800',
      IZIN: 'bg-blue-100 text-blue-800',
      SAKIT: 'bg-yellow-100 text-yellow-800',
      ALPHA: 'bg-red-100 text-red-800',
      TERLAMBAT: 'bg-orange-100 text-orange-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-72 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Riwayat Absensi
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Hadir</p>
              <p className="text-2xl font-bold text-green-600">{stats.hadir}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Izin</p>
              <p className="text-2xl font-bold text-blue-600">{stats.izin}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Sakit</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.sakit}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Alpha</p>
              <p className="text-2xl font-bold text-red-600">{stats.alpha}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Terlambat</p>
              <p className="text-2xl font-bold text-orange-600">{stats.terlambat}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Periode
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">7 Hari Terakhir</option>
              <option value="month">1 Bulan Terakhir</option>
              <option value="semester">1 Semester</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mata Pelajaran
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Guru
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Waktu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : riwayat.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data riwayat absensi
                      </td>
                    </tr>
                  ) : (
                    riwayat.map((item) => (
                      <tr key={item.uuid} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(item.sesiAbsensi.tanggal).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.sesiAbsensi.mapel.namaMapel}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 hidden md:table-cell">
                          {item.sesiAbsensi.guru?.namaLengkap || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(item.scanTime).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                          {item.keterangan || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalRecords > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Info */}
                <div className="text-sm text-gray-700">
                  Menampilkan {riwayat.length > 0 ? (currentPage - 1) * perPage + 1 : 0} -{' '}
                  {Math.min(currentPage * perPage, totalRecords)} dari {totalRecords} data
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Prev
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded border ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>

                {/* Per Page Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Per halaman:</label>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
