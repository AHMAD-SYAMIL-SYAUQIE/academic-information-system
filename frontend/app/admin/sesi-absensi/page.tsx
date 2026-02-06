'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

interface Sesi { uuid: string; tanggal: string; jamMulai: string; jamSelesai: string; status: string; kelas?: { namaKelas: string }; mapel?: { namaMapel: string }; guru?: { namaLengkap: string } }

export default function AdminSesiAbsensiPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [sesi, setSesi] = useState<Sesi[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [kelas, setKelas] = useState<any[]>([])
  const [mapel, setMapel] = useState<any[]>([])
  const [gurus, setGurus] = useState<any[]>([]) // 1. Add state for gurus
  const [formData, setFormData] = useState({ kelasUuid: '', mapelUuid: '', guruUuid: '', tanggal: new Date().toISOString().split('T')[0], jamMulai: '07:00', jamSelesai: '08:30' }) // 2. Add guruUuid to formData

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') router.push('/login')
    else fetchData()
  }, [isAuthenticated, user, router])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      // 3. Fetch gurus along with other data
      const [sesiRes, kelasRes, mapelRes, guruRes] = await Promise.all([
        api.get('/absensi/sesi'),
        api.get('/kelas'),
        api.get('/mapel'),
        api.get('/users?role=GURU&limit=100') 
      ])
      setSesi(sesiRes.data)
      setKelas(kelasRes.data)
      setMapel(mapelRes.data)
      setGurus(guruRes.data.users || []) // Handle paginated response
    } catch (error: any) { toast.error(error.response?.data?.message || 'Gagal memuat data') }
    finally { setLoading(false) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await api.post('/absensi/sesi', formData)
      toast.success('Sesi absensi berhasil dibuat!')
      setShowModal(false); resetForm(); fetchData()
    } catch (error: any) { toast.error(error.response?.data?.message || 'Gagal membuat sesi') }
    finally { setSubmitting(false) }
  }

  const handleClose = async (uuid: string) => {
    const result = await Swal.fire({
      title: 'Tutup Sesi Absensi?',
      text: 'Sesi akan ditutup dan tidak bisa digunakan lagi!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Tutup!',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    
    const loadingToast = toast.loading('Menutup sesi...')
    try { 
      await api.post(`/absensi/sesi/${uuid}/close`)
      toast.success('Sesi berhasil ditutup!', { id: loadingToast })
      Swal.fire('Ditutup!', 'Sesi absensi telah ditutup.', 'success')
      fetchData() 
    }
    catch (error: any) { toast.error(error.response?.data?.message || 'Gagal menutup sesi', { id: loadingToast }) }
  }

  // 2. Add guruUuid to resetForm
  const resetForm = () => setFormData({ kelasUuid: '', mapelUuid: '', guruUuid: '', tanggal: new Date().toISOString().split('T')[0], jamMulai: '07:00', jamSelesai: '08:30' })

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="ADMIN" />
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div><h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Sesi Absensi</h1><p className="text-slate-600 mt-1.5">Kelola sesi absensi kelas</p></div>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium">+ Buat Sesi</button>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <tr><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tanggal</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Kelas</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Mapel</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Waktu</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th><th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                : sesi.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Belum ada sesi</td></tr>
                : sesi.map((item) => (
                  <tr key={item.uuid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 text-slate-700">{item.kelas?.namaKelas || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">{item.mapel?.namaMapel || '-'}</td>
                    <td className="px-6 py-4 text-slate-700">{item.jamMulai} - {item.jamSelesai}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{item.status === 'ACTIVE' ? '● Aktif' : 'Selesai'}</span></td>
                    <td className="px-6 py-4">{item.status === 'ACTIVE' && <button onClick={() => handleClose(item.uuid)} className="text-red-600 hover:text-red-800 font-medium text-sm">Tutup</button>}</td>
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
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 rounded-t-2xl"><h2 className="text-2xl font-bold">Buat Sesi Absensi</h2></div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* 4. Add Guru dropdown */}
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Guru Pengajar</label><select value={formData.guruUuid} onChange={(e) => setFormData({ ...formData, guruUuid: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" required><option value="">Pilih Guru</option>{gurus.map((user) => <option key={user.guru.uuid} value={user.guru.uuid}>{user.guru.namaLengkap}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Kelas</label><select value={formData.kelasUuid} onChange={(e) => setFormData({ ...formData, kelasUuid: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" required><option value="">Pilih Kelas</option>{kelas.map((k) => <option key={k.uuid} value={k.uuid}>{k.namaKelas}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Mata Pelajaran</label><select value={formData.mapelUuid} onChange={(e) => setFormData({ ...formData, mapelUuid: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" required><option value="">Pilih Mapel</option>{mapel.map((m) => <option key={m.uuid} value={m.uuid}>{m.namaMapel}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal</label><input type="date" value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Jam Mulai</label><input type="time" value={formData.jamMulai} onChange={(e) => setFormData({ ...formData, jamMulai: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" required /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Jam Selesai</label><input type="time" value={formData.jamSelesai} onChange={(e) => setFormData({ ...formData, jamSelesai: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl" required /></div>
              </div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Batal</button><button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg font-medium">Buat Sesi</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
