'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

interface TahunAjaran { uuid: string; tahun: string; }
interface GuruUser { uuid: string; guru: { uuid: string; namaLengkap: string } }
interface Kelas {
  uuid: string
  namaKelas: string
  tingkat: number
  tahunAjaran?: { tahun: string }
  waliKelas?: string
  _count?: { siswa: number }
}

export default function AdminKelasPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<Kelas | null>(null)
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([])
  const [guru, setGuru] = useState<GuruUser[]>([])
  const [formData, setFormData] = useState({
    namaKelas: '',
    tingkat: '10',
    tahunAjaranUuid: '',
    waliKelas: ''
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [kelasRes, taRes, guruRes] = await Promise.all([
        api.get('/kelas'),
        api.get('/tahun-ajaran?isActive=true'), // Fetch only active TA
        api.get('/users?role=GURU&limit=100') // Get all guru
      ])
      setKelas(kelasRes.data)
      setTahunAjaran(taRes.data)
      setGuru(guruRes.data.users || []) // Handle paginated response
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login')
    } else {
      fetchData()
    }
  }, [isAuthenticated, user, router, fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        waliKelas: guru.find(g => g.guru?.uuid === formData.waliKelas)?.guru?.namaLengkap || ''
      }
      
      if (editData) {
        await api.put(`/kelas/${editData.uuid}`, payload)
        toast.success('Kelas berhasil diupdate!')
      } else {
        await api.post('/kelas', payload)
        toast.success('Kelas berhasil ditambahkan!')
      }
      setShowModal(false)
      setEditData(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data')
    }
  }

  const handleEdit = (item: Kelas) => {
    setEditData(item)
    // Note: We find the guru's user UUID from the name, which is brittle.
    // A better long-term solution is to change the schema to store waliKelasUuid.
    // For now, this will work if names are unique.
    const selectedGuru = guru.find(g => g.guru?.namaLengkap === item.waliKelas)
    setFormData({
      namaKelas: item.namaKelas,
      tingkat: String(item.tingkat),
      tahunAjaranUuid: item.tahunAjaran?.tahun || '',
      waliKelas: selectedGuru?.guru?.uuid || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (uuid: string) => {
    const result = await Swal.fire({
      title: 'Hapus Kelas?',
      text: 'Kelas dan semua data terkait akan dihapus!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    
    const loadingToast = toast.loading('Menghapus kelas...')
    try {
      await api.delete(`/kelas/${uuid}`)
      toast.success('Kelas berhasil dihapus!', { id: loadingToast })
      Swal.fire('Terhapus!', 'Kelas telah dihapus.', 'success')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus kelas', { id: loadingToast })
    }
  }

  const resetForm = () => {
    setFormData({ namaKelas: '', tingkat: '10', tahunAjaranUuid: '', waliKelas: '' })
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="ADMIN" />
      
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Manajemen Kelas</h1>
              <p className="text-slate-600 mt-1.5">Kelola data kelas dan wali kelas</p>
            </div>
            <button onClick={() => { resetForm(); setEditData(null); setShowModal(true); }} className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium">+ Tambah Kelas</button>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nama Kelas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tingkat</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tahun Ajaran</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Wali Kelas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Siswa</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                ) : kelas.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Belum ada data kelas</td></tr>
                ) : (
                  kelas.map((item) => (
                    <tr key={item.uuid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{item.namaKelas}</td>
                      <td className="px-6 py-4 text-slate-700">{item.tingkat}</td>
                      <td className="px-6 py-4 text-slate-700">{item.tahunAjaran?.tahun || '-'}</td>
                      <td className="px-6 py-4 text-slate-700">{item.waliKelas || '-'}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{item._count?.siswa || 0} siswa</span></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                          <button onClick={() => handleDelete(item.uuid)} className="text-red-600 hover:text-red-800 font-medium text-sm">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">{editData ? 'Edit Kelas' : 'Tambah Kelas'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Kelas</label>
                <input type="text" value={formData.namaKelas} onChange={(e) => setFormData({ ...formData, namaKelas: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500" placeholder="Contoh: 10 IPA 1" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tingkat</label>
                <select value={formData.tingkat} onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500">
                  <option value="10">Kelas 10</option>
                  <option value="11">Kelas 11</option>
                  <option value="12">Kelas 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tahun Ajaran</label>
                <select required value={formData.tahunAjaranUuid} onChange={(e) => setFormData({ ...formData, tahunAjaranUuid: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500">
                  <option value="">Pilih Tahun Ajaran</option>
                  {tahunAjaran.map((ta) => (<option key={ta.uuid} value={ta.uuid}>{ta.tahun}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Wali Kelas</label>
                <select value={formData.waliKelas} onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500">
                  <option value="">Pilih Wali Kelas</option>
                  {guru.map((g) => (<option key={g.guru?.uuid} value={g.guru?.uuid}>{g.guru?.namaLengkap}</option>))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Batal</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

