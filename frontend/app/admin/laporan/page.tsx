'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import api from '@/lib/api'

interface ReportData { siswa: { uuid: string; namaLengkap: string; nis: string; }; data: any; }

export default function AdminLaporanPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [kelas, setKelas] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState('')
  const [reportType, setReportType] = useState('absensi')
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData[]>([])

  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
    { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ]

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') router.push('/login')
    else fetchKelas()
  }, [isAuthenticated, user, router])

  const fetchKelas = async () => {
    try { const res = await api.get('/kelas'); setKelas(res.data) }
    catch (error) { console.error('Error:', error) }
  }

  const generateReport = async () => {
    if (!selectedKelas) { alert('Pilih kelas terlebih dahulu'); return }
    setLoading(true)
    try {
      const endpoint = reportType === 'absensi' 
        ? `/laporan/absensi/${selectedKelas}?bulan=${bulan}&tahun=${tahun}`
        : `/laporan/nilai/${selectedKelas}`
      const res = await api.get(endpoint)
      setReportData(res.data)
    } catch (error) { console.error('Error:', error); alert('Gagal generate laporan') }
    finally { setLoading(false) }
  }

  const exportExcel = () => {
    if (!selectedKelas) { alert('Generate laporan dulu!'); return }
    const endpoint = reportType === 'absensi'
      ? `/api/laporan/export/absensi/excel/${selectedKelas}?bulan=${bulan}&tahun=${tahun}&role=ADMIN`
      : `/api/laporan/export/nilai/excel/${selectedKelas}?role=ADMIN`
    window.open(endpoint, '_blank')
  }

  const exportPdf = () => {
    if (!selectedKelas) { alert('Generate laporan dulu!'); return }
    const endpoint = reportType === 'absensi'
      ? `/api/laporan/export/absensi/pdf/${selectedKelas}?bulan=${bulan}&tahun=${tahun}&role=ADMIN`
      : `/api/laporan/export/nilai/pdf/${selectedKelas}?role=ADMIN`
    window.open(endpoint, '_blank')
  }

  const getPersentaseColor = (p: number) => p >= 90 ? 'text-emerald-600' : p >= 75 ? 'text-blue-600' : p >= 60 ? 'text-amber-600' : 'text-red-600'
  const getGradeColor = (g: string) => ({ A: 'bg-emerald-100 text-emerald-700', B: 'bg-blue-100 text-blue-700', C: 'bg-amber-100 text-amber-700', D: 'bg-orange-100 text-orange-700', E: 'bg-red-100 text-red-700' }[g] || 'bg-slate-100 text-slate-500')
  const selectedKelasObj = kelas.find(k => k.uuid === selectedKelas)

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="ADMIN" />
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6"><h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Laporan</h1><p className="text-slate-600 mt-1.5">Generate dan export laporan absensi dan nilai</p></div>
        </div>
        <div className="p-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Filter Laporan</h2>
            <div className="grid grid-cols-5 gap-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Laporan</label><select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white"><option value="absensi">Rekap Absensi</option><option value="nilai">Rekap Nilai</option></select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Kelas</label><select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white"><option value="">Pilih Kelas</option>{kelas.map((k) => <option key={k.uuid} value={k.uuid}>{k.namaKelas}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Bulan</label><select value={bulan} onChange={(e) => setBulan(parseInt(e.target.value))} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white">{months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Tahun</label><select value={tahun} onChange={(e) => setTahun(parseInt(e.target.value))} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white">{[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
              <div className="flex items-end"><button onClick={generateReport} disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50">{loading ? 'Loading...' : '📊 Generate'}</button></div>
            </div>
          </div>
          
          {reportData.length > 0 && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Laporan {reportType === 'absensi' ? 'Kehadiran' : 'Nilai'}</h3>
                  <p className="text-slate-500 text-sm">Kelas {selectedKelasObj?.namaKelas} • {months.find(m => m.value === bulan)?.label} {tahun} • {reportData.length} siswa</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportExcel} className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">📥 Excel</button>
                  <button onClick={exportPdf} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">📄 PDF</button>
                  <button onClick={() => window.print()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">🖨️ Print</button>
                </div>
              </div>
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">NIS</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nama</th>
                    {reportType === 'absensi' ? (
                      <><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Hadir</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Izin</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Sakit</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Alpha</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Persentase</th></>
                    ) : (
                      <><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Tugas</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">UH</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">UTS</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">UAS</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Nilai Akhir</th><th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Grade</th></>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.map((row, idx) => (
                    <tr key={row.siswa.uuid} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-slate-600">{idx + 1}</td>
                      <td className="px-6 py-4 text-slate-600">{row.siswa.nis}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{row.siswa.namaLengkap}</td>
                      {reportType === 'absensi' ? (
                        <>
                                            <td className="px-6 py-4 text-center text-emerald-600 font-medium">{row.data?.hadir || '-'}</td>
                                            <td className="px-6 py-4 text-center text-blue-600">{row.data?.izin || '-'}</td>
                                            <td className="px-6 py-4 text-center text-amber-600">{row.data?.sakit || '-'}</td>
                                            <td className="px-6 py-4 text-center text-red-600">{row.data?.alpha || '-'}</td>
                                            <td className="px-6 py-4 text-center"><span className={`font-bold ${getPersentaseColor(row.data?.persentase || 0)}`}>{row.data?.persentase || '-'}%</span></td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-center text-slate-700">{row.data?.nilaiTugas ?? '-'}</td>
                          <td className="px-6 py-4 text-center text-slate-700">{row.data?.nilaiUH ?? '-'}</td>
                          <td className="px-6 py-4 text-center text-slate-700">{row.data?.nilaiUTS ?? '-'}</td>
                          <td className="px-6 py-4 text-center text-slate-700">{row.data?.nilaiUAS ?? '-'}</td>
                          <td className="px-6 py-4 text-center font-bold text-primary-600">{row.data?.nilaiAkhir ?? '-'}</td>
                          <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(row.data?.grade)}`}>{row.data?.grade ?? '-'}</span></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportType === 'absensi' && reportData.length > 0 && (
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 Ringkasan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200"><p className="text-emerald-600 text-sm">Rata-rata Hadir</p><p className="text-2xl font-bold text-emerald-700">{(reportData.reduce((s, r) => s + (r.data?.hadir || 0), 0) / reportData.length).toFixed(1)}</p></div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200"><p className="text-blue-600 text-sm">Total Izin</p><p className="text-2xl font-bold text-blue-700">{reportData.reduce((s, r) => s + (r.data?.izin || 0), 0)}</p></div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-amber-600 text-sm">Total Sakit</p><p className="text-2xl font-bold text-amber-700">{reportData.reduce((s, r) => s + (r.data?.sakit || 0), 0)}</p></div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-red-600 text-sm">Total Alpha</p><p className="text-2xl font-bold text-red-700">{reportData.reduce((s, r) => s + (r.data?.alpha || 0), 0)}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {reportData.length === 0 && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-12 text-center">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Belum Ada Laporan</h3>
              <p className="text-slate-500">Pilih kelas dan klik Generate untuk membuat laporan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
