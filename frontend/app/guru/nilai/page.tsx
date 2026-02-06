'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Kelas {
  uuid: string;
  namaKelas: string;
  tingkat: number;
}

interface Mapel {
  uuid: string;
  namaMapel: string;
  kodeMapel: string;
}

interface Siswa {
  uuid: string;
  namaLengkap: string;
  nis: string;
}

interface NilaiData {
  nilaiTugas: number | null;
  nilaiUH: number | null;
  nilaiUTS: number | null;
  nilaiUAS: number | null;
}

export default function GuruNilaiPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [editedNilai, setEditedNilai] = useState<Record<string, NilaiData>>({});
  const [savedNilai, setSavedNilai] = useState<Record<string, NilaiData>>({});

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'GURU') {
      router.push('/login');
      return;
    }
    if (user) {
      fetchInitialData();
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedKelas && selectedMapel) fetchNilai();
  }, [selectedKelas, selectedMapel]);

  const fetchInitialData = useCallback(async () => {
    if (!user?.profile?.uuid) return;
    setLoading(true);
    try {
      const guruUuid = user?.profile?.uuid || user?.uuid;
      const res = await api.get(`/guru/mengajar?guruUuid=${guruUuid}`);
      setKelasList(res.data.kelas || []);
      setMapelList(res.data.mapel || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data mengajar');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchNilai = async () => {
    setLoading(true);
    try {
      const [kelasRes, nilaiRes] = await Promise.all([
        api.get(`/kelas/${selectedKelas}`),
        api.get(`/nilai/kelas/${selectedKelas}/mapel/${selectedMapel}`),
      ]);
      setSiswaList(kelasRes.data.siswa || []);
      const nilaiMap: Record<string, NilaiData> = {};
      if (Array.isArray(nilaiRes.data)) {
        nilaiRes.data.forEach((n: any) => {
          if (!nilaiMap[n.siswaUuid]) nilaiMap[n.siswaUuid] = { nilaiTugas: null, nilaiUH: null, nilaiUTS: null, nilaiUAS: null };
          if (n.jenisNilai === 'TUGAS') nilaiMap[n.siswaUuid].nilaiTugas = n.nilai;
          if (n.jenisNilai === 'UH') nilaiMap[n.siswaUuid].nilaiUH = n.nilai;
          if (n.jenisNilai === 'UTS') nilaiMap[n.siswaUuid].nilaiUTS = n.nilai;
          if (n.jenisNilai === 'UAS') nilaiMap[n.siswaUuid].nilaiUAS = n.nilai;
        });
      }
      setSavedNilai(nilaiMap);
      setEditedNilai({});
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleNilaiChange = (siswaUuid: string, field: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setEditedNilai(prev => ({ ...prev, [siswaUuid]: { ...savedNilai[siswaUuid], ...prev[siswaUuid], [field]: numValue } }));
  };

  const getNilaiForSiswa = (siswaUuid: string, field: keyof NilaiData): number | null => {
    if (editedNilai[siswaUuid]?.[field] !== undefined) return editedNilai[siswaUuid][field];
    return savedNilai[siswaUuid]?.[field] ?? null;
  };

  const calculateNilaiAkhir = (siswaUuid: string): number | null => {
    const tugas = getNilaiForSiswa(siswaUuid, 'nilaiTugas');
    const uh = getNilaiForSiswa(siswaUuid, 'nilaiUH');
    const uts = getNilaiForSiswa(siswaUuid, 'nilaiUTS');
    const uas = getNilaiForSiswa(siswaUuid, 'nilaiUAS');
    if (tugas === null || uh === null || uts === null || uas === null) return null;
    return Math.round((tugas * 0.2 + uh * 0.2 + uts * 0.3 + uas * 0.3) * 100) / 100;
  };

  const getGradeColor = (nilai: number | null): string => {
    if (nilai === null) return 'text-slate-400';
    if (nilai >= 85) return 'text-emerald-600';
    if (nilai >= 75) return 'text-blue-600';
    if (nilai >= 65) return 'text-amber-600';
    return 'text-red-600';
  };

  const getGradeLetter = (nilai: number | null): string => {
    if (nilai === null) return '-';
    if (nilai >= 85) return 'A';
    if (nilai >= 75) return 'B';
    if (nilai >= 65) return 'C';
    if (nilai >= 55) return 'D';
    return 'E';
  };

  const saveAllNilai = async () => {
    if (Object.keys(editedNilai).length === 0) { toast.error('Tidak ada perubahan nilai'); return; }
    setSaving(true);
    const loadingToast = toast.loading('Menyimpan nilai...');
    try {
      const guruUuid = user?.profile?.uuid || user?.uuid;
      const nilaiData: any[] = [];
      Object.entries(editedNilai).forEach(([siswaUuid, nilai]) => {
        if (nilai.nilaiTugas !== null) nilaiData.push({ siswaUuid, mapelUuid: selectedMapel, guruUuid, jenisNilai: 'TUGAS', nilai: nilai.nilaiTugas });
        if (nilai.nilaiUH !== null) nilaiData.push({ siswaUuid, mapelUuid: selectedMapel, guruUuid, jenisNilai: 'UH', nilai: nilai.nilaiUH });
        if (nilai.nilaiUTS !== null) nilaiData.push({ siswaUuid, mapelUuid: selectedMapel, guruUuid, jenisNilai: 'UTS', nilai: nilai.nilaiUTS });
        if (nilai.nilaiUAS !== null) nilaiData.push({ siswaUuid, mapelUuid: selectedMapel, guruUuid, jenisNilai: 'UAS', nilai: nilai.nilaiUAS });
      });
      await api.post('/nilai/batch', { nilai: nilaiData });
      toast.success('Nilai berhasil disimpan!', { id: loadingToast });
      fetchNilai();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Gagal menyimpan nilai', { id: loadingToast }); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="GURU" />
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Input Nilai Siswa</h1>
            <p className="text-slate-600 mt-1.5">Kelola nilai akademik siswa per kelas dan mata pelajaran</p>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Kelas</label>
                <select value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500">
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map((k) => <option key={k.uuid} value={k.uuid}>{k.namaKelas}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Mata Pelajaran</label>
                <select value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500">
                  <option value="">-- Pilih Mapel --</option>
                  {mapelList.map((m) => <option key={m.uuid} value={m.uuid}>{m.namaMapel}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={saveAllNilai} disabled={saving || Object.keys(editedNilai).length === 0} className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>Menyimpan...</> : <>✓ Simpan Semua</>}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-700 text-sm">ℹ️ <strong>Bobot Nilai:</strong> Tugas 20% | UH 20% | UTS 30% | UAS 30%</div>
          </div>
          {selectedKelas && selectedMapel ? (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              {loading ? (<div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
              ) : siswaList.length === 0 ? (<div className="p-12 text-center text-slate-500">Tidak ada siswa di kelas ini</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                    <tr>
                      <th className="text-left py-4 px-4 text-slate-700 font-semibold">No</th>
                      <th className="text-left py-4 px-4 text-slate-700 font-semibold">NIS</th>
                      <th className="text-left py-4 px-4 text-slate-700 font-semibold">Nama Siswa</th>
                      <th className="text-center py-4 px-4 text-slate-700 font-semibold">Tugas</th>
                      <th className="text-center py-4 px-4 text-slate-700 font-semibold">UH</th>
                      <th className="text-center py-4 px-4 text-slate-700 font-semibold">UTS</th>
                      <th className="text-center py-4 px-4 text-slate-700 font-semibold">UAS</th>
                      <th className="text-center py-4 px-4 text-slate-700 font-semibold">Nilai Akhir</th>
                      <th className="text-center py-4 px-4 text-slate-700 font-semibold">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {siswaList.map((siswa, idx) => {
                      const nilaiAkhir = calculateNilaiAkhir(siswa.uuid);
                      return (
                        <tr key={siswa.uuid} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-600">{idx + 1}</td>
                          <td className="py-3 px-4 text-slate-600">{siswa.nis}</td>
                          <td className="py-3 px-4 text-slate-800 font-medium">{siswa.namaLengkap}</td>
                          <td className="py-3 px-4 text-center"><input type="number" min="0" max="100" value={getNilaiForSiswa(siswa.uuid, 'nilaiTugas') ?? ''} onChange={(e) => handleNilaiChange(siswa.uuid, 'nilaiTugas', e.target.value)} className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-center" /></td>
                          <td className="py-3 px-4 text-center"><input type="number" min="0" max="100" value={getNilaiForSiswa(siswa.uuid, 'nilaiUH') ?? ''} onChange={(e) => handleNilaiChange(siswa.uuid, 'nilaiUH', e.target.value)} className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-center" /></td>
                          <td className="py-3 px-4 text-center"><input type="number" min="0" max="100" value={getNilaiForSiswa(siswa.uuid, 'nilaiUTS') ?? ''} onChange={(e) => handleNilaiChange(siswa.uuid, 'nilaiUTS', e.target.value)} className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-center" /></td>
                          <td className="py-3 px-4 text-center"><input type="number" min="0" max="100" value={getNilaiForSiswa(siswa.uuid, 'nilaiUAS') ?? ''} onChange={(e) => handleNilaiChange(siswa.uuid, 'nilaiUAS', e.target.value)} className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-center" /></td>
                          <td className="py-3 px-4 text-center"><span className={`text-lg font-bold ${getGradeColor(nilaiAkhir)}`}>{nilaiAkhir?.toFixed(2) ?? '-'}</span></td>
                          <td className="py-3 px-4 text-center"><span className={`px-3 py-1 rounded-full text-sm font-bold ${nilaiAkhir !== null ? nilaiAkhir >= 75 ? 'bg-emerald-100 text-emerald-700' : nilaiAkhir >= 65 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{getGradeLetter(nilaiAkhir)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">Pilih Kelas dan Mata Pelajaran</h3>
              <p className="text-slate-500">Silakan pilih kelas dan mata pelajaran untuk menginput nilai siswa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
