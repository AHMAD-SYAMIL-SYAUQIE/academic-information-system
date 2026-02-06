'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth'; // Added this
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast'; // Added this

interface Siswa {
  uuid: string;
  nis: string;
  namaLengkap: string;
  jenisKelamin: string;
  status: string;
  waktuAbsen: string | null;
  keterangan: string | null;
  absensiUuid: string | null;
}

interface MonitoringResponse {
  sesi: {
    uuid: string;
    tanggal: string;
    jamMulai: string;
    jamSelesai: string | null;
    status: string;
    kelas: {
      uuid: string;
      namaKelas: string;
    };
    mapel: {
      uuid: string;
      namaMapel: string;
    };
    guru: {
      uuid: string;
      namaLengkap: string;
    };
    qrCode: any;
  };
  summary: {
    total: number;
    hadir: number;
    izin: number;
    sakit: number;
    alpha: number;
    belumAbsen: number;
  };
  siswa: Siswa[];
  lastUpdate: string;
}

interface SesiAbsensi {
  uuid: string;
  tanggal: string;
  waktuMulai: string;
  waktuSelesai: string | null;
  isActive: boolean;
  kelas: {
    namaKelas: string;
  };
  mapel: {
    namaMapel: string;
  };
}

export default function GuruAbsensiPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sesiList, setSesiList] = useState<SesiAbsensi[]>([]);
  const [selectedSesi, setSelectedSesi] = useState<MonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');

  const fetchSesiList = useCallback(async () => {
    if (!user?.profile?.uuid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const guruUuid = user?.profile?.uuid || user?.uuid;
      const response = await api.get(`/absensi/sesi?guruUuid=${guruUuid}&filter=${filter}`);
      setSesiList(response.data);
    } catch (error) {
      console.error('Error fetching sesi:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'GURU') {
      router.push('/login');
      return;
    }
    if (user) {
      fetchSesiList();
    }
  }, [isAuthenticated, user, router, filter, fetchSesiList]);


  const fetchSesiDetail = async (sesiUuid: string) => {
    try {
      const response = await api.get(`/absensi/sesi/${sesiUuid}/monitoring`);
      setSelectedSesi(response.data);
    } catch (error) {
      console.error('Error fetching sesi detail:', error);
      toast.error('Gagal memuat detail sesi');
    }
  };

  const updateOrCreateAbsensiStatus = async (siswaUuid: string, absensiUuid: string | null, status: string) => {
    try {
      if (absensiUuid) {
        // Update existing absensi
        await api.put(`/absensi/${absensiUuid}`, { status });
      } else {
        // Create new absensi for student who hasn't scanned
        await api.post('/absensi/manual', {
          sesiAbsensiUuid: selectedSesi?.sesi.uuid,
          siswaUuid,
          status,
          keterangan: 'Absensi manual oleh guru'
        });
      }
      
      if (selectedSesi) {
        fetchSesiDetail(selectedSesi.sesi.uuid);
      }
      toast.success('Status absensi diupdate');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal update status');
    }
  };

  const markAbsentStudents = async () => {
    if (!selectedSesi) return;
    if (!confirm('Tandai semua siswa yang belum absen sebagai ALPHA?')) return;
    try {
      await api.post(`/absensi/sesi/${selectedSesi.sesi.uuid}/mark-absent`, {});
      fetchSesiDetail(selectedSesi.sesi.uuid);
      toast.success('Siswa berhasil ditandai alpha');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal menandai siswa');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      HADIR: 'bg-emerald-100 text-emerald-600',
      IZIN: 'bg-blue-100 text-blue-600',
      SAKIT: 'bg-amber-100 text-amber-600',
      ALPHA: 'bg-red-100 text-red-600',
      TERLAMBAT: 'bg-orange-100 text-orange-600'
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  const getAttendanceStats = () => {
    if (!selectedSesi) return { hadir: 0, izin: 0, sakit: 0, alpha: 0, belumAbsen: 0, total: 0 };
    return selectedSesi.summary;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <Sidebar role="GURU" />
        <div className="flex-1 ml-72 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const stats = getAttendanceStats();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="GURU" />
      
      <div className="flex-1 ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Monitoring Absensi</h1>
              <p className="text-slate-500">Pantau kehadiran siswa secara real-time</p>
            </div>
            <div className="flex gap-2">
              {['today', 'week', 'month'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === f
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f === 'today' ? 'Hari Ini' : f === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session List */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Daftar Sesi</h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {sesiList.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Tidak ada sesi absensi</p>
                  ) : (
                    sesiList.map((sesi) => (
                      <div
                        key={sesi.uuid}
                        onClick={() => fetchSesiDetail(sesi.uuid)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          selectedSesi?.sesi?.uuid === sesi.uuid
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-800 font-medium">{sesi.kelas.namaKelas}</span>
                          {sesi.isActive && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-sm">{sesi.mapel.namaMapel}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {new Date(sesi.tanggal).toLocaleDateString('id-ID')} •{' '}
                          {new Date(sesi.waktuMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Detail */}
            <div className="lg:col-span-2">
              {selectedSesi ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl">
                  {/* Session Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">
                        {selectedSesi.sesi.kelas.namaKelas} - {selectedSesi.sesi.mapel.namaMapel}
                      </h2>
                      <p className="text-slate-500">
                        {new Date(selectedSesi.sesi.tanggal).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    {selectedSesi.sesi.status === 'ACTIVE' && (
                      <button
                        onClick={markAbsentStudents}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors text-sm font-medium"
                      >
                        Tandai Alpha
                      </button>
                    )}
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-slate-100 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                      <p className="text-slate-500 text-sm">Total</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
                      <p className="text-2xl font-bold text-emerald-600">{stats.hadir}</p>
                      <p className="text-slate-500 text-sm">Hadir</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                      <p className="text-2xl font-bold text-blue-600">{stats.izin}</p>
                      <p className="text-slate-500 text-sm">Izin</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                      <p className="text-2xl font-bold text-amber-600">{stats.sakit}</p>
                      <p className="text-slate-500 text-sm">Sakit</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                      <p className="text-2xl font-bold text-red-600">{stats.alpha}</p>
                      <p className="text-slate-500 text-sm">Alpha</p>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-slate-600 font-medium">No</th>
                          <th className="text-left py-3 px-4 text-slate-600 font-medium">NIS</th>
                          <th className="text-left py-3 px-4 text-slate-600 font-medium">Nama Siswa</th>
                          <th className="text-left py-3 px-4 text-slate-600 font-medium">Waktu</th>
                          <th className="text-left py-3 px-4 text-slate-600 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-slate-600 font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSesi.siswa && selectedSesi.siswa.length > 0 ? (
                          selectedSesi.siswa.map((siswa, index) => (
                            <tr key={siswa.uuid} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-600">{index + 1}</td>
                              <td className="py-3 px-4 text-slate-600">{siswa.nis}</td>
                              <td className="py-3 px-4 text-slate-800 font-medium">{siswa.namaLengkap}</td>
                              <td className="py-3 px-4 text-slate-600">
                                {siswa.waktuAbsen
                                  ? new Date(siswa.waktuAbsen).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(siswa.status)}`}>
                                  {siswa.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={siswa.status}
                                  onChange={(e) => updateOrCreateAbsensiStatus(siswa.uuid, siswa.absensiUuid, e.target.value)}
                                  className="px-2 py-1 bg-white border border-slate-300 rounded text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  disabled={siswa.status === 'BELUM_ABSEN' && selectedSesi.sesi.status !== 'ACTIVE'}
                                >
                                  {siswa.status === 'BELUM_ABSEN' && <option value="BELUM_ABSEN">Belum Absen</option>}
                                  <option value="HADIR">Hadir</option>
                                  <option value="TERLAMBAT">Terlambat</option>
                                  <option value="IZIN">Izin</option>
                                  <option value="SAKIT">Sakit</option>
                                  <option value="ALPHA">Alpha</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              Tidak ada data siswa
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-xl">
                  <svg className="w-16 h-16 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Pilih Sesi Absensi</h3>
                  <p className="text-slate-500">Pilih sesi dari daftar di sebelah kiri untuk melihat detail kehadiran</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
