import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({ currentPage, totalPages, onPageChange, isLoading = false }: PaginationProps) {
  // Always show for debugging
  console.log('Pagination component rendered:', { currentPage, totalPages, isLoading });
  
  if (totalPages <= 1) {
    console.log('Pagination not showing: totalPages <= 1');
    return (
      <div className="bg-green-100 border border-green-300 rounded-lg p-4 my-6">
        <p className="text-center text-green-800">No pagination needed - only {totalPages} page(s)</p>
      </div>
    );
  }

  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="bg-purple-100 border-2 border-purple-400 rounded-lg p-6 my-6">
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="flex items-center gap-1 bg-white hover:bg-purple-50 border-purple-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <div key={`dots-${index}`} className="flex items-center justify-center w-8 h-8 bg-white rounded border border-purple-300">
                  <MoreHorizontal className="h-4 w-4 text-purple-600" />
                </div>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
                className={`w-8 h-8 p-0 ${
                  currentPage === page 
                    ? "bg-purple-600 text-white" 
                    : "bg-white hover:bg-purple-50 border-purple-300"
                }`}
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="flex items-center gap-1 bg-white hover:bg-purple-50 border-purple-300"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Page info */}
      <div className="text-center mt-3 text-sm text-purple-800 font-medium">
        Page {currentPage} of {totalPages} • Total: {totalPages} pages
      </div>
    </div>
  );
} 