'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

interface Mapel { uuid: string; kodeMapel: string; namaMapel: string; deskripsi?: string }

export default function AdminMapelPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [mapel, setMapel] = useState<Mapel[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<Mapel | null>(null)
  const [formData, setFormData] = useState({ kodeMapel: '', namaMapel: '', deskripsi: '' })

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') router.push('/login')
    else fetchData()
  }, [isAuthenticated, user, router])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/mapel')
      setMapel(res.data)
    } catch (error: any) { toast.error(error.response?.data?.message || 'Gagal memuat data') }
    finally { setLoading(false) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      if (editData) await api.put(`/mapel/${editData.uuid}`, formData)
      else await api.post('/mapel', formData)
      toast.success(editData ? 'Mapel berhasil diupdate!' : 'Mapel berhasil ditambahkan!')
      setShowModal(false); setEditData(null); resetForm(); fetchData()
    } catch (error: any) { toast.error(error.response?.data?.message || 'Gagal menyimpan') }
    finally { setSubmitting(false) }
  }

  const handleEdit = (item: Mapel) => { setEditData(item); setFormData({ kodeMapel: item.kodeMapel, namaMapel: item.namaMapel, deskripsi: item.deskripsi || '' }); setShowModal(true) }
  const handleDelete = async (uuid: string) => { 
    const result = await Swal.fire({
      title: 'Hapus Mata Pelajaran?',
      text: 'Data mata pelajaran akan dihapus permanen!',
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
      await api.delete(`/mapel/${uuid}`)
      toast.success('Mapel berhasil dihapus!', { id: loadingToast })
      Swal.fire('Terhapus!', 'Mata pelajaran telah dihapus.', 'success')
      fetchData() 
    } 
    catch (error: any) { toast.error(error.response?.data?.message || 'Gagal hapus', { id: loadingToast }) } 
  }
  const resetForm = () => setFormData({ kodeMapel: '', namaMapel: '', deskripsi: '' })

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="ADMIN" />
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Kelola Mata Pelajaran</h1>
              <p className="text-slate-600 mt-1.5">Kelola data mata pelajaran sekolah</p>
            </div>
            <button onClick={() => { resetForm(); setEditData(null); setShowModal(true); }} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium">+ Tambah Mapel</button>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Kode</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nama</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Deskripsi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                : mapel.length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Belum ada data</td></tr>
                : mapel.map((item) => (
                  <tr key={item.uuid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4"><span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{item.kodeMapel}</span></td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.namaMapel}</td>
                    <td className="px-6 py-4 text-slate-600">{item.deskripsi || '-'}</td>
                    <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button><button onClick={() => handleDelete(item.uuid)} className="text-red-600 hover:text-red-800 font-medium text-sm">Hapus</button></div></td>
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
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-6 rounded-t-2xl"><h2 className="text-2xl font-bold">{editData ? 'Edit' : 'Tambah'} Mapel</h2></div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Kode</label><input type="text" value={formData.kodeMapel} onChange={(e) => setFormData({ ...formData, kodeMapel: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" placeholder="MTK" required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Nama</label><input type="text" value={formData.namaMapel} onChange={(e) => setFormData({ ...formData, namaMapel: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" placeholder="Matematika" required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Deskripsi</label><textarea value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" rows={3} /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Batal</button><button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg font-medium">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
