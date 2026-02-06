'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

interface User {
  uuid: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  admin?: { namaLengkap: string; email: string }
  guru?: { namaLengkap: string; nip: string; email: string }
  siswa?: { namaLengkap: string; nis: string; email: string; kelas?: { namaKelas: string } }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [perPage, setPerPage] = useState(10)
  
  const [formData, setFormData] = useState({
    role: 'SISWA',
    username: '',
    password: 'password123',
    namaLengkap: '',
    email: '',
    noTelp: '',
    nip: '',
    nis: '',
    jenisKelamin: 'L',
    alamat: '',
    kelasUuid: '',
  })
  const [classes, setClasses] = useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login')
    } else {
      fetchUsers()
      fetchClasses()
    }
  }, [isAuthenticated, user, router])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/users', {
        params: {
          ...(filter !== 'ALL' ? { role: filter } : {}),
          page: currentPage,
          limit: perPage
        }
      })
      
      // Check if response has pagination data
      if (response.data.users) {
        setUsers(response.data.users)
        setTotalPages(response.data.totalPages || 1)
        setTotalUsers(response.data.total || response.data.users.length)
      } else {
        // Fallback for old API format without pagination
        setUsers(response.data)
        setTotalPages(1)
        setTotalUsers(response.data.length)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data user')
    } finally {
      setLoading(false)
    }
  }, [filter, currentPage, perPage])

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/kelas')
      setClasses(response.data)
    } catch (error: any) {
      toast.error('Gagal memuat data kelas')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1) // Reset to page 1 when filter changes
      fetchUsers()
    }
  }, [filter, perPage])
  
  useEffect(() => {
    if (isAuthenticated) fetchUsers()
  }, [currentPage])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/users', formData)
      toast.success('User berhasil dibuat!')
      setShowModal(false)
      fetchUsers()
      setFormData({
        role: 'SISWA',
        username: '',
        password: 'password123',
        namaLengkap: '',
        email: '',
        noTelp: '',
        nip: '',
        nis: '',
        jenisKelamin: 'L',
        alamat: '',
        kelasUuid: '',
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat user')
    }
  }

  const handleDeactivate = async (uuid: string) => {
    const result = await Swal.fire({
      title: 'Nonaktifkan User?',
      text: 'User akan dinonaktifkan dan tidak bisa login!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Nonaktifkan!',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    
    const loadingToast = toast.loading('Memproses...')
    try {
      await api.patch(`/users/${uuid}`, { action: 'deactivate' })
      toast.success('User berhasil dinonaktifkan!', { id: loadingToast })
      Swal.fire('Berhasil!', 'User telah dinonaktifkan.', 'success')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menonaktifkan user', { id: loadingToast })
    }
  }

  const getName = (user: User) => {
    return user.admin?.namaLengkap || user.guru?.namaLengkap || user.siswa?.namaLengkap || '-'
  }

  const getIdentifier = (user: User) => {
    if (user.guru?.nip) return user.guru.nip
    if (user.siswa?.nis) return user.siswa.nis
    return '-'
  }

  const getEmail = (user: User) => {
    return user.admin?.email || user.guru?.email || user.siswa?.email || '-'
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="ADMIN" />
      
      <div className="flex-1 ml-0 md:ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-4 md:px-8 py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Manajemen Users
                </h1>
                <p className="text-sm md:text-base text-slate-600 mt-1.5">Kelola data Admin, Guru, dan Siswa</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm md:text-base w-full md:w-auto"
              >
                + Tambah User
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200/60 p-2 mb-6 flex gap-2 overflow-x-auto">
            {['ALL', 'ADMIN', 'GURU', 'SISWA'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm md:text-base ${
                  filter === tab
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' ? 'Semua' : tab}
              </button>
            ))}
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Username</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Nama Lengkap</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Role</th>
                    <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">NIP/NIS</th>
                    <th className="hidden lg:table-cell px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap">Aksi</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada data user
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.uuid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-3 text-slate-800 font-medium whitespace-nowrap text-sm">{user.username}</td>
                      <td className="px-3 py-3 text-slate-700 whitespace-nowrap text-sm">{getName(user)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'GURU' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-3 py-3 text-slate-700 whitespace-nowrap text-sm">{getIdentifier(user)}</td>
                      <td className="hidden lg:table-cell px-3 py-3 text-slate-700 whitespace-nowrap text-sm max-w-[200px] truncate" title={getEmail(user)}>{getEmail(user)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {user.isActive && (
                          <button
                            onClick={() => handleDeactivate(user.uuid)}
                            className="text-red-600 hover:text-red-800 font-medium text-xs"
                          >
                            Nonaktifkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="border-t border-slate-200 px-4 py-4 bg-slate-50/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Info & Per Page Selector */}
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>
                    Menampilkan {users.length > 0 ? ((currentPage - 1) * perPage + 1) : 0} - {Math.min(currentPage * perPage, totalUsers)} dari {totalUsers} data
                  </span>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={10}>10 per halaman</option>
                    <option value={25}>25 per halaman</option>
                    <option value={50}>50 per halaman</option>
                    <option value={100}>100 per halaman</option>
                  </select>
                </div>

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === 1
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ← Prev
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                            currentPage === pageNumber
                              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2 py-1.5 text-slate-400">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-9 h-9 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === totalPages
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Tambah User Baru</h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="ADMIN">Admin</option>
                  <option value="GURU">Guru</option>
                  <option value="SISWA">Siswa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {formData.role === 'GURU' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">NIP</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {formData.role === 'SISWA' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">NIS</label>
                    <input
                      type="text"
                      value={formData.nis}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Kelas</label>
                    <select
                      value={formData.kelasUuid}
                      onChange={(e) => setFormData({ ...formData, kelasUuid: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Kelas</option>
                      {classes.map((kelas) => (
                        <option key={kelas.uuid} value={kelas.uuid}>
                          {kelas.namaKelas}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">No Telp</label>
                  <input
                    type="text"
                    value={formData.noTelp}
                    onChange={(e) => setFormData({ ...formData, noTelp: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {(formData.role === 'GURU' || formData.role === 'SISWA') && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Kelamin</label>
                    <select
                      value={formData.jenisKelamin}
                      onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat</label>
                    <textarea
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg font-medium"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
