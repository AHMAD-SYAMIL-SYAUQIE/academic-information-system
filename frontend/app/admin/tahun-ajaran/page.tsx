'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

interface TahunAjaran { uuid: string; tahun: string; tanggalMulai: Date; tanggalSelesai: Date; semester: string; isActive: boolean }

export default function AdminTahunAjaranPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [data, setData] = useState<TahunAjaran[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<TahunAjaran | null>(null)
  const [formData, setFormData] = useState({ tahun: '', tanggalMulai: new Date().toISOString().split('T')[0], tanggalSelesai: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], semester: 'GANJIL' })

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') router.push('/login')
    else fetchData()
  }, [isAuthenticated, user, router])

  const fetchData = useCallback(async () => {
    try { setLoading(true); const res = await api.get('/tahun-ajaran'); setData(res.data) }
    catch (error: any) { toast.error(error.response?.data?.message || 'Gagal memuat data') }
    finally { setLoading(false) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      if (editData) await api.put(`/tahun-ajaran/${editData.uuid}`, formData)
      else await api.post('/tahun-ajaran', formData)
      toast.success(editData ? 'Tahun ajaran berhasil diupdate!' : 'Tahun ajaran berhasil ditambahkan!')
      setShowModal(false); setEditData(null); resetForm(); fetchData()
    } catch (error: any) { toast.error(error.response?.data?.message || 'Gagal menyimpan') }
    finally { setSubmitting(false) }
  }

  const handleEdit = (item: TahunAjaran) => { setEditData(item); setFormData({ tahun: item.tahun, tanggalMulai: new Date(item.tanggalMulai).toISOString().split('T')[0], tanggalSelesai: new Date(item.tanggalSelesai).toISOString().split('T')[0], semester: item.semester }); setShowModal(true) }
  const handleActivate = async (uuid: string) => { 
    const loadingToast = toast.loading('Mengaktifkan...')
    try { 
      await api.put(`/tahun-ajaran/${uuid}`, { action: 'activate' }); 
      toast.success('Tahun ajaran berhasil diaktifkan!', { id: loadingToast }); 
      fetchData(); 
    } 
    catch (error: any) { toast.error(error.response?.data?.message || 'Gagal mengaktifkan', { id: loadingToast }); } 
  }
  const handleDelete = async (uuid: string) => { 
    const result = await Swal.fire({
      title: 'Hapus Tahun Ajaran?',
      text: 'Semua data terkait tahun ajaran ini akan dihapus!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    
    const loadingToast = toast.loading('Menghapus...')
    try { 
      await api.delete(`/tahun-ajaran/${uuid}`)
      toast.success('Tahun ajaran berhasil dihapus!', { id: loadingToast })
      Swal.fire('Terhapus!', 'Tahun ajaran telah dihapus.', 'success')
      fetchData() 
    } 
    catch (error: any) { toast.error(error.response?.data?.message || 'Gagal menghapus', { id: loadingToast }) } 
  }
  const resetForm = () => setFormData({ tahun: '', tanggalMulai: new Date().toISOString().split('T')[0], tanggalSelesai: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], semester: 'GANJIL' })

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="ADMIN" />
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div><h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Tahun Ajaran</h1><p className="text-slate-600 mt-1.5">Kelola periode tahun ajaran</p></div>
            <button onClick={() => { resetForm(); setEditData(null); setShowModal(true); }} className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium">+ Tambah</button>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <tr><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tahun Ajaran</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tanggal Mulai</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tanggal Selesai</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Semester</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                : data.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Belum ada data</td></tr>
                : data.map((item) => (
                  <tr key={item.uuid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{item.tahun}</td>
                    <td className="px-6 py-4 text-slate-700">{new Date(item.tanggalMulai).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 text-slate-700">{new Date(item.tanggalSelesai).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${item.semester === 'GANJIL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{item.semester}</span></td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.isActive ? '✓ Aktif' : 'Nonaktif'}</span></td>
                    <td className="px-6 py-4"><div className="flex gap-2">{!item.isActive && <button onClick={() => handleActivate(item.uuid)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Aktifkan</button>}<button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button><button onClick={() => handleDelete(item.uuid)} className="text-red-600 hover:text-red-800 font-medium text-sm">Hapus</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-6 rounded-t-2xl"><h2 className="text-2xl font-bold">{editData ? 'Edit' : 'Tambah'} Tahun Ajaran</h2></div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Tahun Ajaran (e.g., 2024/2025)</label><input type="text" value={formData.tahun} onChange={(e) => setFormData({ ...formData, tahun: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" placeholder="2024/2025" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Mulai</label><input type="date" value={formData.tanggalMulai} onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" required /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Selesai</label><input type="date" value={formData.tanggalSelesai} onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" required /></div>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Semester</label><select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl"><option value="GANJIL">Ganjil</option><option value="GENAP">Genap</option></select></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Batal</button><button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg font-medium">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
