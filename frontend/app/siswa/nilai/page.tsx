'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface NilaiMapel {
  mapel: { uuid: string; namaMapel: string; kodeMapel: string; };
  nilai: { nilaiTugas: number | null; nilaiUH: number | null; nilaiUTS: number | null; nilaiUAS: number | null; nilaiAkhir: number | null; } | null;
}

export default function SiswaNilaiPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [nilaiList, setNilaiList] = useState<NilaiMapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('1');

  const fetchNilai = useCallback(async () => {
    if (!user?.profile?.uuid) {
      setLoading(false);
      return; // Do not fetch if user uuid is not available
    }
    const siswaUuid = user.profile.uuid;

    setLoading(true);
    try {
      const res = await api.get(`/nilai/siswa/${siswaUuid}?semester=${semester}`);
      // Assuming API returns an array of grades
      // Need to adjust response structure if API returns something else
      setNilaiList(res.data); 
    } catch (error: any) {
      console.error('Error fetching nilai:', error);
      toast.error(error.response?.data?.message || 'Gagal memuat data nilai');
      setNilaiList([]); // Fallback to empty array on error
    } finally { setLoading(false); }
  }, [user, semester]);

  useEffect(() => {
    if (!isAuthenticated) { 
      const local = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (local && token) {
        try {
          const parsed = JSON.parse(local)
          // setUser(parsed, token) // Assuming setUser updates isAuthenticated
        } catch {}
      } else {
        router.push('/login');
        return;
      }
    }
    if (user && user.role !== 'SISWA') { router.push('/login'); return; }

    if (isAuthenticated && user?.role === 'SISWA') {
      fetchNilai();
    }
  }, [isAuthenticated, user, router, semester, fetchNilai]);

  const getGradeColor = (n: number | null) => n === null ? 'text-slate-400' : n >= 85 ? 'text-emerald-600' : n >= 75 ? 'text-blue-600' : n >= 65 ? 'text-amber-600' : 'text-red-600';
  const getGradeLetter = (n: number | null) => n === null ? '-' : n >= 85 ? 'A' : n >= 75 ? 'B' : n >= 65 ? 'C' : n >= 55 ? 'D' : 'E';
  const getGradeBadge = (n: number | null) => n === null ? 'bg-slate-100 text-slate-500' : n >= 85 ? 'bg-emerald-100 text-emerald-700' : n >= 75 ? 'bg-blue-100 text-blue-700' : n >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const average = (() => { const valid = nilaiList.filter(n => n.nilai?.nilaiAkhir != null); return valid.length > 0 ? Math.round((valid.reduce((a, n) => a + (n.nilai?.nilaiAkhir || 0), 0) / valid.length) * 100) / 100 : null; })();
  const completed = nilaiList.filter(n => n.nilai?.nilaiAkhir != null).length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="SISWA" />
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Nilai Akademik</h1>
              <p className="text-slate-600 mt-1.5">Lihat nilai per mata pelajaran</p>
            </div>
            <div className="flex gap-2">
              {['1', '2'].map((s) => (
                <button key={s} onClick={() => setSemester(s)} className={`px-4 py-2 rounded-lg font-medium transition-all ${semester === s ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>Semester {s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-slate-500 text-sm mb-1">Rata-rata Nilai</p><p className={`text-4xl font-bold ${getGradeColor(average)}`}>{average?.toFixed(1) || '-'}</p></div>
                <div className={`px-4 py-2 rounded-xl ${getGradeBadge(average)}`}><span className="text-2xl font-bold">{getGradeLetter(average)}</span></div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-slate-500 text-sm mb-1">Nilai Lengkap</p><p className="text-4xl font-bold text-slate-800">{completed}</p></div>
                <p className="text-slate-400 text-lg">/ {nilaiList.length}</p>
              </div>
              <div className="mt-3 bg-slate-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${(completed / nilaiList.length) * 100}%` }}></div></div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
              <div><p className="text-slate-500 text-sm mb-1">Total Mata Pelajaran</p><p className="text-4xl font-bold text-slate-800">{nilaiList.length}</p></div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-700 text-sm">ℹ️ <strong>Bobot Nilai:</strong> Tugas 20% | UH 20% | UTS 30% | UAS 30%</div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            {loading ? <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div> : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                  <tr>
                    <th className="text-left py-4 px-4 text-slate-700 font-semibold">Mata Pelajaran</th>
                    <th className="text-center py-4 px-4 text-slate-700 font-semibold">Tugas</th>
                    <th className="text-center py-4 px-4 text-slate-700 font-semibold">UH</th>
                    <th className="text-center py-4 px-4 text-slate-700 font-semibold">UTS</th>
                    <th className="text-center py-4 px-4 text-slate-700 font-semibold">UAS</th>
                    <th className="text-center py-4 px-4 text-slate-700 font-semibold">Nilai Akhir</th>
                    <th className="text-center py-4 px-4 text-slate-700 font-semibold">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {nilaiList.map((item) => (
                    <tr key={item.mapel.uuid} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4"><div><p className="text-slate-800 font-medium">{item.mapel.namaMapel}</p><p className="text-slate-500 text-sm">{item.mapel.kodeMapel}</p></div></td>
                      <td className="py-4 px-4 text-center"><span className={getGradeColor(item.nilai?.nilaiTugas ?? null)}>{item.nilai?.nilaiTugas ?? '-'}</span></td>
                      <td className="py-4 px-4 text-center"><span className={getGradeColor(item.nilai?.nilaiUH ?? null)}>{item.nilai?.nilaiUH ?? '-'}</span></td>
                      <td className="py-4 px-4 text-center"><span className={getGradeColor(item.nilai?.nilaiUTS ?? null)}>{item.nilai?.nilaiUTS ?? '-'}</span></td>
                      <td className="py-4 px-4 text-center"><span className={getGradeColor(item.nilai?.nilaiUAS ?? null)}>{item.nilai?.nilaiUAS ?? '-'}</span></td>
                      <td className="py-4 px-4 text-center"><span className={`text-lg font-bold ${getGradeColor(item.nilai?.nilaiAkhir ?? null)}`}>{item.nilai?.nilaiAkhir?.toFixed(1) ?? '-'}</span></td>
                      <td className="py-4 px-4 text-center"><span className={`px-3 py-1.5 rounded-full text-sm font-bold ${getGradeBadge(item.nilai?.nilaiAkhir ?? null)}`}>{getGradeLetter(item.nilai?.nilaiAkhir ?? null)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="mt-6 bg-white/50 backdrop-blur-xl rounded-xl p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Keterangan Grade:</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-slate-600">A (≥85) - Sangat Baik</span></span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-slate-600">B (75-84) - Baik</span></span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-slate-600">C (65-74) - Cukup</span></span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-slate-600">E (&lt;55) - Sangat Kurang</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
