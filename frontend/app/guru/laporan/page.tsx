'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Kelas { uuid: string; namaKelas: string; }
interface Mapel { uuid: string; namaMapel: string; kodeMapel: string; }
interface ReportData { siswa: { uuid: string; namaLengkap: string; nis: string; }; data: any; }

export default function GuruLaporanPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [formData, setFormData] = useState({ kelasUuid: '', mapelUuid: '', reportType: 'absensi', bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() });

  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
    { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  const fetchKelasList = useCallback(async () => {
    if (!user?.profile?.uuid) {
      setLoading(false);
      return;
    }
    try { 
      const guruUuid = user?.profile?.uuid || user?.uuid;
      const res = await api.get(`/guru/mengajar?guruUuid=${guruUuid}`); 
      setKelasList(res.data.kelas || []); 
      setMapelList(res.data.mapel || []);
    }
    catch (error) { console.error('Error fetching kelas:', error); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user && user.role !== 'GURU') { router.push('/login'); return; }
    if (user) {
      fetchKelasList();
    }
  }, [isAuthenticated, user, router, fetchKelasList]);

  const generateReport = async () => {
    if (!formData.kelasUuid) { alert('Pilih kelas terlebih dahulu!'); return; }
    if (formData.reportType === 'nilai' && !formData.mapelUuid) { alert('Pilih mata pelajaran terlebih dahulu!'); return; }
    if (!user?.profile?.uuid) { alert('Guru ID tidak ditemukan!'); return; }
    setGenerating(true);
    try {
      const endpoint = formData.reportType === 'absensi' 
        ? `/laporan/absensi/${formData.kelasUuid}?guruUuid=${user.profile.uuid}&bulan=${formData.bulan}&tahun=${formData.tahun}`
        : `/laporan/nilai/${formData.kelasUuid}?guruUuid=${user.profile.uuid}&mapelUuid=${formData.mapelUuid}`;
      const res = await api.get(endpoint);
      setReportData(res.data);
    } catch (error) { 
      console.error('Error:', error);
      alert('Gagal generate laporan');
    }
    finally { setGenerating(false); }
  };

  const exportExcel = () => {
    if (!formData.kelasUuid) { alert('Generate laporan dulu!'); return; }
    if (formData.reportType === 'nilai' && !formData.mapelUuid) { alert('Pilih mata pelajaran terlebih dahulu!'); return; }
    if (!user?.profile?.uuid) { alert('Guru ID tidak ditemukan!'); return; }
    const endpoint = formData.reportType === 'absensi'
      ? `/api/laporan/export/absensi/excel/${formData.kelasUuid}?guruUuid=${user.profile.uuid}&bulan=${formData.bulan}&tahun=${formData.tahun}&mapelUuid=${formData.mapelUuid}&role=GURU`
      : `/api/laporan/export/nilai/excel/${formData.kelasUuid}?guruUuid=${user.profile.uuid}&mapelUuid=${formData.mapelUuid}&role=GURU`;
    window.open(endpoint, '_blank');
  };

  const exportPdf = () => {
    if (!formData.kelasUuid) { alert('Generate laporan dulu!'); return; }
    if (formData.reportType === 'nilai' && !formData.mapelUuid) { alert('Pilih mata pelajaran terlebih dahulu!'); return; }
    if (!user?.profile?.uuid) { alert('Guru ID tidak ditemukan!'); return; }
    const endpoint = formData.reportType === 'absensi'
      ? `/api/laporan/export/absensi/pdf/${formData.kelasUuid}?guruUuid=${user.profile.uuid}&bulan=${formData.bulan}&tahun=${formData.tahun}&mapelUuid=${formData.mapelUuid}&role=GURU`
      : `/api/laporan/export/nilai/pdf/${formData.kelasUuid}?guruUuid=${user.profile.uuid}&mapelUuid=${formData.mapelUuid}&role=GURU`;
    window.open(endpoint, '_blank');
  };

  const getPersentaseColor = (p: number) => p >= 90 ? 'text-emerald-600' : p >= 75 ? 'text-blue-600' : p >= 60 ? 'text-amber-600' : 'text-red-600';
  const getGradeColor = (g: string) => ({ A: 'bg-emerald-100 text-emerald-700', B: 'bg-blue-100 text-blue-700', C: 'bg-amber-100 text-amber-700', D: 'bg-orange-100 text-orange-700', E: 'bg-red-100 text-red-700' }[g] || 'bg-slate-100 text-slate-500');
  const selectedKelas = kelasList.find(k => k.uuid === formData.kelasUuid);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="GURU" />
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Laporan Kelas</h1>
            <p className="text-slate-600 mt-1.5">Generate dan export laporan absensi dan nilai siswa</p>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Filter Laporan</h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Laporan</label>
                <select value={formData.reportType} onChange={(e) => setFormData({ ...formData, reportType: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white">
                  <option value="absensi">Laporan Absensi</option>
                  <option value="nilai">Laporan Nilai</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Kelas</label>
                <select value={formData.kelasUuid} onChange={(e) => setFormData({ ...formData, kelasUuid: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white">
                  <option value="">Pilih Kelas</option>
                  {kelasList.map((k) => <option key={k.uuid} value={k.uuid}>{k.namaKelas}</option>)}
                </select>
              </div>
              {formData.reportType === 'nilai' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mata Pelajaran <span className="text-red-500">*</span></label>
                  <select value={formData.mapelUuid} onChange={(e) => setFormData({ ...formData, mapelUuid: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white">
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {mapelList.map((m) => <option key={m.uuid} value={m.uuid}>{m.namaMapel}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Bulan</label>
                <select value={formData.bulan} onChange={(e) => setFormData({ ...formData, bulan: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white">
                  {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tahun</label>
                <select value={formData.tahun} onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white">
                  {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={generateReport} disabled={generating} className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50">
                  {generating ? 'Loading...' : '📊 Generate'}
                </button>
              </div>
            </div>
          </div>

          {reportData.length > 0 && (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Laporan {formData.reportType === 'absensi' ? 'Kehadiran' : 'Nilai'} Siswa</h3>
                  <p className="text-slate-500 text-sm">Kelas {selectedKelas?.namaKelas} • {months.find(m => m.value === formData.bulan)?.label} {formData.tahun}</p>
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
                    <th className="text-left py-4 px-4 text-slate-700 font-semibold">No</th>
                    <th className="text-left py-4 px-4 text-slate-700 font-semibold">NIS</th>
                    <th className="text-left py-4 px-4 text-slate-700 font-semibold">Nama Siswa</th>
                    {formData.reportType === 'absensi' ? (
                      <><th className="text-center py-4 px-4 text-slate-700 font-semibold">Hadir</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">Izin</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">Sakit</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">Alpha</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">Persentase</th></>
                    ) : (
                      <><th className="text-center py-4 px-4 text-slate-700 font-semibold">Tugas</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">UH</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">UTS</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">UAS</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">Nilai Akhir</th><th className="text-center py-4 px-4 text-slate-700 font-semibold">Grade</th></>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.map((row, idx) => (
                    <tr key={row.siswa.uuid} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-600">{idx + 1}</td>
                      <td className="py-3 px-4 text-slate-600">{row.siswa.nis}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{row.siswa.namaLengkap}</td>
                      {formData.reportType === 'absensi' ? (
                        <>
                          <td className="py-3 px-4 text-center text-emerald-600 font-medium">{row.data.hadir}</td>
                          <td className="py-3 px-4 text-center text-blue-600">{row.data.izin}</td>
                          <td className="py-3 px-4 text-center text-amber-600">{row.data.sakit}</td>
                          <td className="py-3 px-4 text-center text-red-600">{row.data.alpha}</td>
                          <td className="py-3 px-4 text-center"><span className={`font-bold ${getPersentaseColor(row.data.persentase)}`}>{row.data.persentase}%</span></td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-center text-slate-700">{row.data.nilaiTugas ?? '-'}</td>
                          <td className="py-3 px-4 text-center text-slate-700">{row.data.nilaiUH ?? '-'}</td>
                          <td className="py-3 px-4 text-center text-slate-700">{row.data.nilaiUTS ?? '-'}</td>
                          <td className="py-3 px-4 text-center text-slate-700">{row.data.nilaiUAS ?? '-'}</td>
                          <td className="py-3 px-4 text-center font-bold text-primary-600">{row.data.nilaiAkhir ?? '-'}</td>
                          <td className="py-3 px-4 text-center"><span className={`px-3 py-1 rounded-full text-sm font-bold ${getGradeColor(row.data.grade)}`}>{row.data.grade}</span></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {formData.reportType === 'absensi' && (
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Ringkasan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200"><p className="text-emerald-600 text-sm">Rata-rata Hadir</p><p className="text-2xl font-bold text-emerald-700">{(reportData.reduce((s, r) => s + r.data.hadir, 0) / reportData.length).toFixed(1)}</p></div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200"><p className="text-blue-600 text-sm">Total Izin</p><p className="text-2xl font-bold text-blue-700">{reportData.reduce((s, r) => s + r.data.izin, 0)}</p></div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-amber-600 text-sm">Total Sakit</p><p className="text-2xl font-bold text-amber-700">{reportData.reduce((s, r) => s + r.data.sakit, 0)}</p></div>
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-red-600 text-sm">Total Alpha</p><p className="text-2xl font-bold text-red-700">{reportData.reduce((s, r) => s + r.data.alpha, 0)}</p></div>
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
  );
}
