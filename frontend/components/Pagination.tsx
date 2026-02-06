// Reusable Pagination Component
interface PaginationProps {
  currentPage: number
  totalPages: number
  totalRecords: number
  perPage: number
  recordsCount: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  showPerPageSelector?: boolean
}

export default function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  perPage,
  recordsCount,
  onPageChange,
  onPerPageChange,
  showPerPageSelector = false
}: PaginationProps) {
  if (totalPages <= 1 && !showPerPageSelector) return null

  return (
    <div className="border-t border-slate-200 px-4 py-4 bg-slate-50/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Info & Per Page Selector */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            Menampilkan {recordsCount > 0 ? ((currentPage - 1) * perPage + 1) : 0} - {Math.min(currentPage * perPage, totalRecords)} dari {totalRecords} data
          </span>
          
          {showPerPageSelector && onPerPageChange && (
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value={10}>10 / halaman</option>
              <option value={20}>20 / halaman</option>
              <option value={50}>50 / halaman</option>
              <option value={100}>100 / halaman</option>
            </select>
          )}
        </div>

        {/* Page Numbers */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === 1
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              ← Prev
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNumber
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2 py-1.5 text-slate-400">...</span>
                  <button
                    onClick={() => onPageChange(totalPages)}
                    className="w-9 h-9 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === totalPages
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
