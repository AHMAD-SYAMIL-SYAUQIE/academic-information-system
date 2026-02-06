import Swal from 'sweetalert2'

// Custom theme untuk sistem akademik
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

// Konfirmasi standar (untuk hapus, tutup sesi, dll)
export const confirm = async (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Ya, Lanjutkan',
    cancelButtonText: 'Batal',
    reverseButtons: true
  })
}

// Success alert
export const success = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#10b981',
    confirmButtonText: 'OK'
  })
}

// Error alert
export const error = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'OK'
  })
}

// Info alert
export const info = (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'info',
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Mengerti'
  })
}

// Loading
export const loading = (title: string = 'Memproses...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    }
  })
}

// Close loading
export const closeLoading = () => {
  Swal.close()
}

export default Swal
