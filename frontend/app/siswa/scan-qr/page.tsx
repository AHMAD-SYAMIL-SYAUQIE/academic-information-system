'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function SiswaScanQRPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'SISWA') {
      router.push('/login');
      return;
    }
    getLocation();
  }, [router, isAuthenticated, user]);

  useEffect(() => {
    if (status !== 'scanning') return;

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        qrbox: { width: 250, height: 250 },
        fps: 10,
      },
      false // verbose
    );

    function onScanSuccess(decodedText: string, decodedResult: any) {
      scanner.clear();
      submitAbsensi(decodedText);
    }

    function onScanFailure(error: any) {
      // console.warn(`Code scan error = ${error}`);
    }

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scanner) {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
        });
      }
    };
  }, [status]);


  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Tidak dapat mengakses lokasi. Pastikan GPS aktif dan izin lokasi diberikan.');
        }
      );
    } else {
      toast.error('Browser tidak mendukung geolocation');
    }
  };

  const submitAbsensi = async (qrCodeText: string) => {
    if (!location) {
      toast.error('Lokasi tidak tersedia. Aktifkan GPS dan coba lagi.');
      return;
    }
    
    let qrPayload;
    try {
      qrPayload = JSON.parse(qrCodeText);
      if (!qrPayload.token || !qrPayload.sesiUuid) {
        throw new Error('Invalid QR Code payload');
      }
    } catch (e) {
      setStatus('error');
      setMessage('QR Code tidak valid atau rusak.');
      toast.error('QR Code tidak valid atau rusak.');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Memproses absensi...');
    try {
      await api.post('/absensi/scan', {
        token: qrPayload.token,
        sesiUuid: qrPayload.sesiUuid,
        siswaUuid: user?.profile?.uuid,
        latitude: location.lat,
        longitude: location.lng
      });

      setStatus('success');
      setMessage('Absensi berhasil tercatat!');
      toast.success('Absensi berhasil tercatat!', { id: loadingToast });
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Gagal melakukan absensi');
      toast.error(error.response?.data?.message || 'Gagal melakukan absensi', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar role="SISWA" />
      
      <div className="flex-1 ml-72 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Scan QR Absensi</h1>
            <p className="text-slate-500">Arahkan kamera ke QR Code untuk melakukan absensi</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 overflow-hidden shadow-xl p-6">
            {status === 'success' ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-emerald-600 mb-2">Berhasil!</h3>
                <p className="text-slate-600 mb-6">{message}</p>
                <button onClick={() => setStatus('idle')} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30">Scan Lagi</button>
              </div>
            ) : status === 'error' ? (
              <div className="text-center py-12">
                 <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>
                <h3 className="text-2xl font-bold text-red-600 mb-2">Gagal!</h3>
                <p className="text-slate-600 mb-6">{message}</p>
                <button onClick={() => setStatus('idle')} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30">Coba Lagi</button>
              </div>
            ) : status === 'scanning' ? (
              <div>
                <div id="reader" className="w-full"></div>
                <button onClick={() => setStatus('idle')} className="w-full mt-4 py-3 bg-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-200 transition-colors">Batal</button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
                <button
                  onClick={() => setStatus('scanning')}
                  disabled={!location || submitting}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Mulai Scan QR
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
