'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface IzinHadir {
  uuid: string;
  siswaUsername: string;
  kelasNama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  jenis: string;
  keterangan: string;
  buktiFile: string | null;
  status: string;
  createdAt: string;
  approvedBy?: {
    namaGuru: string;
  };
}

export default function GuruIzinPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [izinList, setIzinList] = useState<IzinHadir[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedIzin, setSelectedIzin] = useState<IzinHadir | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchIzinList = useCallback(async () => {
    if (!user?.profile?.uuid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const guruUuid = user.profile.uuid;
      // Build query params
      let query = `guruUuid=${guruUuid}`;
      if (filter !== 'ALL') {
        query += `&status=${filter}`;
      }
      const response = await api.get(`/izin-hadir?${query}`);
      setIzinList(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data izin');
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
      fetchIzinList();
    }
  }, [isAuthenticated, user, router, fetchIzinList]);

  const handleApprove = async () => {
    if (!selectedIzin || !user?.profile?.uuid) return;
    setProcessing(true);
    const loadingToast = toast.loading('Memproses persetujuan...');
    try {
      await api.put(
        `/izin-hadir/${selectedIzin.uuid}/approve`,
        { guruUuid: user.profile.uuid, catatanGuru: keterangan }
      );
      toast.success('Izin berhasil disetujui!', { id: loadingToast });
      setSelectedIzin(null);
      setKeterangan('');
      fetchIzinList();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyetujui izin', { id: loadingToast });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedIzin || !user?.profile?.uuid) return;
    if (!keterangan.trim()) {
      toast.error('Masukkan alasan penolakan!');
      return;
    }
    setProcessing(true);
    const loadingToast = toast.loading('Memproses penolakan...');
    try {
      await api.put(
        `/izin-hadir/${selectedIzin.uuid}/reject`,
        { guruUuid: user.profile.uuid, catatanGuru: keterangan }
      );
      toast.success('Izin berhasil ditolak!', { id: loadingToast });
      setSelectedIzin(null);
      setKeterangan('');
      fetchIzinList();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menolak izin', { id: loadingToast });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: 'bg-amber-100', text: 'text-amber-600' },
      APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-600' }
    };
    const style = styles[status] || styles.PENDING;
    return `${style.bg} ${style.text}`;
  };

  const getJenisBadge = (jenis: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      SAKIT: { bg: 'bg-blue-100', text: 'text-blue-600' },
      IZIN: { bg: 'bg-purple-100', text: 'text-purple-600' },
      DISPENSASI: { bg: 'bg-cyan-100', text: 'text-cyan-600' }
    };
    const style = styles[jenis] || { bg: 'bg-slate-100', text: 'text-slate-600' };
    return `${style.bg} ${style.text}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="GURU" />
      
      <div className="flex-1 ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Kelola Izin Siswa</h1>
              <p className="text-slate-500">Tinjau dan verifikasi pengajuan izin siswa</p>
            </div>
            <div className="flex gap-2">
              {['PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filter === f
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f === 'PENDING' ? 'Menunggu' : f === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-amber-200 p-4 text-center shadow-lg">
              <p className="text-2xl font-bold text-amber-600">
                {izinList.filter(i => i.status === 'PENDING').length}
              </p>
              <p className="text-slate-600 text-sm">Menunggu</p>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-emerald-200 p-4 text-center shadow-lg">
              <p className="text-2xl font-bold text-emerald-600">
                {izinList.filter(i => i.status === 'APPROVED').length}
              </p>
              <p className="text-slate-600 text-sm">Disetujui</p>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-red-200 p-4 text-center shadow-lg">
              <p className="text-2xl font-bold text-red-600">
                {izinList.filter(i => i.status === 'REJECTED').length}
              </p>
              <p className="text-slate-600 text-sm">Ditolak</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Izin List */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-800">Daftar Pengajuan Izin</h2>
                </div>

                {izinList.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Tidak ada data izin</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {izinList.map((izin) => (
                      <div
                        key={izin.uuid}
                        onClick={() => {
                          setSelectedIzin(izin);
                          setKeterangan('');
                        }}
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                          selectedIzin?.uuid === izin.uuid ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${getJenisBadge(izin.jenis)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-lg font-bold">{izin.jenis.charAt(0)}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-slate-800 font-medium">{izin.siswaUsername}</span>
                            </div>
                            <p className="text-slate-600 text-sm mb-1">{izin.kelasNama}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getJenisBadge(izin.jenis)}`}>
                                {izin.jenis}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(izin.status)}`}>
                                {izin.status}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {formatDate(izin.tanggalMulai)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right text-xs text-slate-500 flex-shrink-0">
                            <p>{formatDate(izin.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              {selectedIzin ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-6 shadow-xl sticky top-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Detail Pengajuan</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500">Nama Siswa</p>
                      <p className="text-slate-800 font-medium">{selectedIzin.siswaUsername}</p>
                      <p className="text-slate-600 text-sm">{selectedIzin.kelasNama}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Jenis Izin</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getJenisBadge(selectedIzin.jenis)}`}>
                        {selectedIzin.jenis}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Tanggal</p>
                      <p className="text-slate-800">
                        {formatDate(selectedIzin.tanggalMulai)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Alasan</p>
                      <p className="text-slate-800">{selectedIzin.keterangan}</p>
                    </div>

                    {selectedIzin.buktiFile && (
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Bukti</p>
                        <a
                          href={selectedIzin.buktiFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Lihat Bukti
                        </a>
                      </div>
                    )}

                    {selectedIzin.status === 'PENDING' && (
                      <>
                        <div>
                          <label className="text-sm text-slate-500 block mb-2">Keterangan (opsional)</label>
                          <textarea
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Tambahkan catatan..."
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={handleReject}
                            disabled={processing}
                            className="flex-1 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-medium rounded-xl transition-colors disabled:opacity-50"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={handleApprove}
                            disabled={processing}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/30"
                          >
                            {processing ? 'Memproses...' : 'Setujui'}
                          </button>
                        </div>
                      </>
                    )}

                    {selectedIzin.status !== 'PENDING' && selectedIzin.keterangan && (
                      <div className="p-4 bg-slate-100 rounded-xl">
                        <p className="text-sm text-slate-500">Catatan</p>
                        <p className="text-slate-800">{selectedIzin.keterangan}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-xl">
                  <svg className="w-16 h-16 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Pilih Pengajuan</h3>
                  <p className="text-slate-500">Pilih pengajuan izin dari daftar untuk melihat detail</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
