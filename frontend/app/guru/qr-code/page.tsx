'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import * as Alert from '@/lib/sweetalert';

// Updated interfaces to match API response
interface Kelas { uuid: string; namaKelas: string; }
interface Mapel { uuid: string; namaMapel: string; }
interface QRCode { uuid: string; qrData: string; }
interface SesiAbsensi { uuid: string; tanggal: string; jamMulai: string; jamSelesai: string; status: string; kelas: Kelas; mapel: Mapel; qrCode: QRCode[]; }

export default function GuruQRCodePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [activeSesi, setActiveSesi] = useState<SesiAbsensi | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({ kelasUuid: '', mapelUuid: '' });

  const fetchDependencies = useCallback(async () => {
    try {
      const [kelasRes, mapelRes] = await Promise.all([
        api.get('/kelas'),
        api.get('/mapel'),
      ]);
      setKelasList(kelasRes.data);
      setMapelList(mapelRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data kelas/mapel');
    }
  }, []);
  
  const fetchActiveSesi = useCallback(async (guruUuid: string) => {
    try {
      setLoading(true);
      const sesiRes = await api.get(`/absensi/sesi?status=ACTIVE&guruUuid=${guruUuid}`);
      if (sesiRes.data && sesiRes.data.length > 0) {
        setActiveSesi(sesiRes.data[0]);
      } else {
        setActiveSesi(null);
      }
    } catch (e) {
      toast.error('Gagal memeriksa sesi aktif');
      setActiveSesi(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'GURU') {
      router.push('/login');
      return;
    }
    if (user.profile?.uuid) {
      fetchActiveSesi(user.profile.uuid);
    }
    fetchDependencies();
  }, [isAuthenticated, user, router, fetchActiveSesi, fetchDependencies]);

  const generateSesi = async () => {
    if (!formData.kelasUuid || !formData.mapelUuid) {
      Alert.error('Data Tidak Lengkap', 'Pilih kelas dan mata pelajaran terlebih dahulu!');
      return;
    }
    if (!user?.profile?.uuid) {
      Alert.error('Error', 'Profil guru tidak ditemukan. Silakan login ulang.');
      return;
    }
    setGenerating(true);
    Alert.loading('Membuat sesi absensi...');
    
    // Set default times
    const now = new Date();
    const jamMulai = now.toTimeString().slice(0, 5);
    now.setHours(now.getHours() + 2); // Session lasts for 2 hours
    const jamSelesai = now.toTimeString().slice(0, 5);

    try {
      const response = await api.post('/absensi/sesi', {
        ...formData,
        guruUuid: user.profile.uuid,
        tanggal: new Date().toISOString().split('T')[0],
        jamMulai,
        jamSelesai,
        skipValidation: true // TEMPORARY: Bypass validation untuk development
      });
      setActiveSesi(response.data);
      Alert.success('Berhasil!', 'Sesi absensi berhasil dibuat. Siswa dapat scan QR Code sekarang.');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal membuat sesi absensi';
      Alert.error('Gagal Membuat Sesi', message);
    } finally {
      setGenerating(false);
    }
  };

  const closeSesi = async () => {
    if (!activeSesi) return;
    
    const result = await Alert.confirm(
      'Tutup Sesi Absensi?',
      'Siswa tidak akan bisa scan QR Code setelah sesi ditutup. Lanjutkan?'
    );
    
    if (!result.isConfirmed) return;
    
    Alert.loading('Menutup sesi...');
    try {
      await api.post(`/absensi/sesi/${activeSesi.uuid}/close`);
      setActiveSesi(null);
      Alert.success('Berhasil!', 'Sesi absensi telah ditutup.');
    } catch (e: any) {
      Alert.error('Gagal', e.response?.data?.message || 'Gagal menutup sesi');
    }
  };

  const downloadQR = () => {
    const qrDataUrl = activeSesi?.qrCode[0]?.qrData;
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-absensi-${activeSesi.kelas.namaKelas}-${new Date(activeSesi.tanggal).toLocaleDateString('id-ID')}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Alert.Toast.fire({
      icon: 'success',
      title: 'QR Code berhasil diunduh'
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
      <div className="flex-1 ml-72">
        <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">QR Code Absensi</h1>
            <p className="text-slate-600 mt-1.5">Generate QR Code untuk absensi siswa</p>
          </div>
        </div>
        <div className="p-8">
          {!activeSesi ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">📱 Buat Sesi Absensi Baru</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Kelas</label>
                    <select value={formData.kelasUuid} onChange={(e) => setFormData({ ...formData, kelasUuid: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Pilih Kelas --</option>
                      {kelasList.map((k) => <option key={k.uuid} value={k.uuid}>{k.namaKelas}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Mata Pelajaran</label>
                    <select value={formData.mapelUuid} onChange={(e) => setFormData({ ...formData, mapelUuid: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Pilih Mapel --</option>
                      {mapelList.map((m) => <option key={m.uuid} value={m.uuid}>{m.namaMapel}</option>)}
                    </select>
                  </div>
                  <button onClick={generateSesi} disabled={generating} className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 text-lg mt-4">
                    {generating ? '⏳ Generating...' : '🔄 Buat Sesi & Tampilkan QR'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-8 text-center">
                  <div className="mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      Sesi Aktif
                    </span>
                  </div>
                  {activeSesi.qrCode && activeSesi.qrCode[0] ? (
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-lg mb-6">
                      <img src={activeSesi.qrCode[0].qrData} alt="QR Code Absensi" className="w-64 h-64" />
                    </div>
                  ) : <p className="text-slate-500">QR Code tidak tersedia.</p>}
                  <div className="flex gap-3 justify-center">
                    <button onClick={downloadQR} className="px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl font-medium transition-all">📥 Download</button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/60 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">📋 Detail Sesi</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Kelas</span><span className="font-medium text-slate-800">{activeSesi.kelas?.namaKelas || '-'}</span></div>
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Mata Pelajaran</span><span className="font-medium text-slate-800">{activeSesi.mapel?.namaMapel || '-'}</span></div>
                      <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Tanggal</span><span className="font-medium text-slate-800">{new Date(activeSesi.tanggal).toLocaleDateString('id-ID')}</span></div>
                      <div className="flex justify-between py-2"><span className="text-slate-500">Waktu</span><span className="font-medium text-slate-800">{activeSesi.jamMulai} - {activeSesi.jamSelesai}</span></div>
                    </div>
                  </div>

                  <button onClick={closeSesi} className="w-full px-6 py-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium transition-all">
                    ❌ Tutup Sesi Absensi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
