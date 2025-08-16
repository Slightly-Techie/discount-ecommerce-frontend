import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  isLoading?: boolean;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  onNextPage,
  onPreviousPage,
  hasNextPage = false,
  hasPreviousPage = false,
  isLoading = false 
}: PaginationProps) {
  // Always show for debugging
  console.log('Pagination component rendered:', { currentPage, totalPages, isLoading });
  
  if (totalPages <= 1) {
    console.log('Pagination not showing: totalPages <= 1');
    return (
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 my-6">
        <p className="text-center text-primary font-medium">No pagination needed - only {totalPages} page(s)</p>
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
    <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-6 my-6 border border-primary/10">
      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage || (() => onPageChange(currentPage - 1))}
          disabled={(!hasPreviousPage && currentPage <= 1) || isLoading}
          className="flex items-center gap-1 bg-white hover:bg-primary/10 border-primary/30 text-primary hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <div key={`dots-${index}`} className="flex items-center justify-center w-8 h-8 bg-white rounded border border-primary/30">
                  <MoreHorizontal className="h-4 w-4 text-primary" />
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
                    ? "bg-gradient-primary text-white border-0" 
                    : "bg-white hover:bg-primary/10 border-primary/30 text-primary hover:text-primary"
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
          onClick={onNextPage || (() => onPageChange(currentPage + 1))}
          disabled={(!hasNextPage && currentPage >= totalPages) || isLoading}
          className="flex items-center gap-1 bg-white hover:bg-primary/10 border-primary/30 text-primary hover:text-primary"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Page info */}
      <div className="text-center mt-3 text-sm text-primary font-medium">
        Page {currentPage} of {totalPages} • Total: {totalPages} pages
      </div>
    </div>
  );
} 