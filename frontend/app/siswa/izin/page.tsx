'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface IzinHadir {
  id: number;
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

export default function SiswaIzinPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [izinList, setIzinList] = useState<IzinHadir[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    jenis: 'IZIN',
    tanggalMulai: '',
    tanggalSelesai: '',
    keterangan: '',
    buktiFile: null as File | null
  });

  const fetchIzinList = useCallback(async () => {
    if (!user?.profile?.uuid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/izin-hadir?siswaUuid=${user.profile.uuid}`);
      setIzinList(response.data);
    } catch (error: any) {
      console.error('Error fetching izin:', error);
      toast.error(error.response?.data?.message || 'Gagal memuat riwayat izin.');
      setIzinList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user && user.role !== 'SISWA') {
      router.push('/login');
      return;
    }
    if (user) {
      fetchIzinList();
    }
  }, [isAuthenticated, user, router, fetchIzinList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tanggalMulai || !formData.tanggalSelesai || !formData.keterangan) {
      toast.error('Lengkapi semua data!');
      return;
    }

    if (new Date(formData.tanggalSelesai) < new Date(formData.tanggalMulai)) {
      toast.error('Tanggal selesai tidak boleh sebelum tanggal mulai!');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Mengirim pengajuan izin...');
    try {
      if (formData.buktiFile) {
        const data = new FormData();
        data.append('jenis', formData.jenis);
        data.append('tanggalMulai', formData.tanggalMulai);
        data.append('tanggalSelesai', formData.tanggalSelesai);
        data.append('keterangan', formData.keterangan);
        data.append('bukti', formData.buktiFile);

        await api.post('/izin-hadir', data, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await api.post('/izin-hadir', {
          jenis: formData.jenis,
          tanggalMulai: formData.tanggalMulai,
          tanggalSelesai: formData.tanggalSelesai,
          keterangan: formData.keterangan
        });
      }

      toast.success('Pengajuan izin berhasil dikirim!', { id: loadingToast });
      setShowModal(false);
      setFormData({
        jenis: 'IZIN',
        tanggalMulai: '',
        tanggalSelesai: '',
        keterangan: '',
        buktiFile: null
      });
      fetchIzinList();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengajukan izin', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-amber-100', text: 'text-amber-600', label: 'Menunggu' },
      APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Disetujui' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Ditolak' }
    };
    return styles[status] || styles.PENDING;
  };

  const getJenisBadge = (jenis: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      SAKIT: { bg: 'bg-blue-100', text: 'text-blue-600' },
      IZIN: { bg: 'bg-purple-100', text: 'text-purple-600' },
      DISPENSASI: { bg: 'bg-cyan-100', text: 'text-cyan-600' }
    };
    return styles[jenis] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} hari`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <Sidebar role="SISWA" />
        <div className="flex-1 ml-72 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="SISWA" />
      
      <div className="flex-1 ml-72 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Pengajuan Izin</h1>
              <p className="text-slate-500">Ajukan izin tidak hadir ke sekolah</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajukan Izin
            </button>
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

          {/* Izin List */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Riwayat Pengajuan</h2>
            </div>

            {izinList.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Belum ada pengajuan izin</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ajukan izin pertama Anda
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {izinList.map((izin) => {
                  const statusStyle = getStatusBadge(izin.status);
                  const jenisStyle = getJenisBadge(izin.jenis);
                  return (
                    <div key={izin.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className={`w-12 h-12 rounded-xl ${statusStyle.bg} flex items-center justify-center flex-shrink-0`}>
                          {izin.status === 'PENDING' && (
                            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {izin.status === 'APPROVED' && (
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {izin.status === 'REJECTED' && (
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${jenisStyle.bg} ${jenisStyle.text}`}>
                              {izin.jenis}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                              {statusStyle.label}
                            </span>
                            <span className="text-slate-500 text-sm">
                              {getDuration(izin.tanggalMulai, izin.tanggalSelesai)}
                            </span>
                          </div>

                          <p className="text-slate-800 mb-1">{izin.keterangan}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>{formatDate(izin.tanggalMulai)} - {formatDate(izin.tanggalSelesai)}</span>
                            {izin.buktiFile && (
                              <a
                                href={izin.buktiFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                Bukti
                              </a>
                            )}
                          </div>

                          {izin.approvedBy && (
                            <div className="mt-2 p-3 bg-slate-100 rounded-lg">
                              <p className="text-slate-500 text-xs">
                                Disetujui oleh {izin.approvedBy.namaGuru}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Date Submitted */}
                        <div className="text-right text-sm text-slate-500 flex-shrink-0">
                          <p>Diajukan</p>
                          <p>{formatDate(izin.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-800">Ajukan Izin</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Izin</label>
                  <select
                    value={formData.jenis}
                    onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IZIN">Izin</option>
                    <option value="SAKIT">Sakit</option>
                    <option value="DISPENSASI">Dispensasi</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={formData.tanggalMulai}
                      onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={formData.tanggalSelesai}
                      onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Keterangan</label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jelaskan keterangan izin..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bukti/Surat (opsional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFormData({ ...formData, buktiFile: e.target.files?.[0] || null })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white file:cursor-pointer"
                  />
                  <p className="text-slate-500 text-xs mt-1">Format: PDF, JPG, PNG (Maks. 2MB)</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        Mengirim...
                      </>
                    ) : (
                      'Kirim Pengajuan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
