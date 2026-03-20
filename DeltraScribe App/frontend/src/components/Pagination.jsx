import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange, isLoading }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 0; i < totalPages; i++) {
        pages.push(i);
    }

    // Limit visible pages if there are too many
    const maxVisible = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }

    const visiblePages = pages.slice(startPage, endPage + 1);

    return (
        <div className="flex items-center justify-center space-x-2 py-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0 || isLoading}
                className="p-2 rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-deltascribe-emerald hover:border-deltascribe-emerald disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            
            {startPage > 0 && (
                <>
                    <button
                        onClick={() => onPageChange(0)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                            currentPage === 0
                                ? 'bg-deltascribe-emerald text-white shadow-lg shadow-deltascribe-emerald/20'
                                : 'bg-white text-gray-500 border border-gray-100 hover:border-deltascribe-emerald hover:text-deltascribe-emerald'
                        }`}
                    >
                        1
                    </button>
                    {startPage > 1 && <span className="text-gray-400">...</span>}
                </>
            )}

            {visiblePages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    disabled={isLoading}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${
                        currentPage === page
                            ? 'bg-deltascribe-emerald text-white shadow-lg shadow-deltascribe-emerald/20'
                            : 'bg-white text-gray-500 border border-gray-100 hover:border-deltascribe-emerald hover:text-deltascribe-emerald'
                    }`}
                >
                    {page + 1}
                </button>
            ))}

            {endPage < totalPages - 1 && (
                <>
                    {endPage < totalPages - 2 && <span className="text-gray-400">...</span>}
                    <button
                        onClick={() => onPageChange(totalPages - 1)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                            currentPage === totalPages - 1
                                ? 'bg-deltascribe-emerald text-white shadow-lg shadow-deltascribe-emerald/20'
                                : 'bg-white text-gray-500 border border-gray-100 hover:border-deltascribe-emerald hover:text-deltascribe-emerald'
                        }`}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1 || isLoading}
                className="p-2 rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-deltascribe-emerald hover:border-deltascribe-emerald disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Pagination;
