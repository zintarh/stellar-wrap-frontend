'use client';

/**
 * Pagination Component
 *
 * Accessible pagination controls for transaction history table.
 * Implements WCAG AA standards with proper ARIA labels and keyboard navigation.
 *
 * Optionally displays the user's current XLM balance alongside the page
 * indicator. Pass `xlmBalance` (a pre-formatted decimal string) and
 * `xlmBalanceStatus` to enable the balance badge.
 */

import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';

/** Fetch status forwarded from `useXlmBalance` */
export type XlmBalanceStatus = 'idle' | 'loading' | 'success' | 'error';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  ariaLabel?: string;
  showPageNumbers?: boolean;
  maxPageButtons?: number;
  isLoading?: boolean;
  /**
   * Pre-formatted XLM balance string (e.g. "1234.56").
   * Obtained from `useXlmBalance`. When provided, a balance badge is rendered
   * alongside the page indicator.
   */
  xlmBalance?: string | null;
  /**
   * Fetch status for the XLM balance. Controls the loading / error display
   * inside the balance badge.
   */
  xlmBalanceStatus?: XlmBalanceStatus;
}

/**
 * Calculate which page numbers to display
 */
function getPaginationRange(
  currentPage: number,
  totalPages: number,
  maxButtons: number
): number[] {
  const halfWindow = Math.floor(maxButtons / 2);
  let startPage = Math.max(1, currentPage - halfWindow);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
}

/**
 * Pagination Component
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  ariaLabel = 'Pagination navigation',
  showPageNumbers = true,
  maxPageButtons = 5,
  isLoading = false,
  xlmBalance,
  xlmBalanceStatus = 'idle',
}) => {
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, isLoading, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, isLoading, onPageChange]);

  const handlePageClick = useCallback(
    (page: number) => {
      if (page !== currentPage && !isLoading) {
        onPageChange(page);
      }
    },
    [currentPage, isLoading, onPageChange]
  );

  const pages = showPageNumbers ? getPaginationRange(currentPage, totalPages, maxPageButtons) : [];
  const showFirstEllipsis = showPageNumbers && pages[0] > 1;
  const showLastEllipsis = showPageNumbers && pages[pages.length - 1] < totalPages;

  const isPrevDisabled = currentPage <= 1 || isLoading || totalPages === 0;
  const isNextDisabled = currentPage >= totalPages || isLoading || totalPages === 0;

  return (
    <nav
      aria-label={ariaLabel}
      className={clsx('flex items-center justify-center gap-2 py-4', className)}
      role="navigation"
    >
      {/* Previous Page Button */}
      <button
        onClick={handlePrevPage}
        disabled={isPrevDisabled}
        aria-label="Go to previous page"
        aria-disabled={isPrevDisabled}
        className={clsx(
          'inline-flex items-center justify-center rounded-md px-3 py-2',
          'transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-[var(--color-theme-primary)]',
          isPrevDisabled
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        )}
      >
        <ChevronLeft
          size={18}
          className="flex-shrink-0"
          aria-hidden="true"
        />
        <span className="ml-1 hidden text-sm font-medium sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      {showPageNumbers && totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* First page (if not visible) */}
          {showFirstEllipsis && (
            <>
              <PageButton
                page={1}
                isActive={currentPage === 1}
                isLoading={isLoading}
                onClick={handlePageClick}
              />
              {pages[0] > 2 && (
                <span
                  className="px-2 py-2 text-gray-500 dark:text-gray-500"
                  aria-hidden="true"
                >
                  …
                </span>
              )}
            </>
          )}

          {/* Page range */}
          {pages.map((page) => (
            <PageButton
              key={page}
              page={page}
              isActive={currentPage === page}
              isLoading={isLoading}
              onClick={handlePageClick}
            />
          ))}

          {/* Last page (if not visible) */}
          {showLastEllipsis && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && (
                <span
                  className="px-2 py-2 text-gray-500 dark:text-gray-500"
                  aria-hidden="true"
                >
                  …
                </span>
              )}
              <PageButton
                page={totalPages}
                isActive={currentPage === totalPages}
                isLoading={isLoading}
                onClick={handlePageClick}
              />
            </>
          )}
        </div>
      )}

      {/* Next Page Button */}
      <button
        onClick={handleNextPage}
        disabled={isNextDisabled}
        aria-label="Go to next page"
        aria-disabled={isNextDisabled}
        className={clsx(
          'inline-flex items-center justify-center rounded-md px-3 py-2',
          'transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-[var(--color-theme-primary)]',
          isNextDisabled
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        )}
      >
        <span className="mr-1 hidden text-sm font-medium sm:inline">Next</span>
        <ChevronRight
          size={18}
          className="flex-shrink-0"
          aria-hidden="true"
        />
      </button>

      {/* Page Info + XLM Balance */}
      <div
        className="ml-auto flex flex-col items-end gap-0.5"
        aria-live="polite"
      >
        {/* Page counter */}
        <span
          className="text-xs text-gray-600 dark:text-gray-400"
          role="status"
        >
          Page {currentPage} of {totalPages}
        </span>

        {/* XLM balance badge — only rendered when the prop is provided */}
        {(xlmBalance !== undefined || xlmBalanceStatus === 'loading') && (
          <span
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              'bg-gray-100 dark:bg-gray-800',
              xlmBalanceStatus === 'error'
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400',
            )}
            aria-label={
              xlmBalanceStatus === 'loading'
                ? 'Fetching XLM balance'
                : xlmBalanceStatus === 'error'
                  ? 'XLM balance unavailable'
                  : `XLM balance: ${xlmBalance ?? '0'}`
            }
          >
            {xlmBalanceStatus === 'loading' ? (
              <>
                <Loader2
                  size={10}
                  className="animate-spin"
                  aria-hidden="true"
                />
                <span aria-hidden="true">XLM</span>
              </>
            ) : xlmBalanceStatus === 'error' ? (
              <span>XLM —</span>
            ) : (
              <>
                <span aria-hidden="true">⊕</span>
                <span>{xlmBalance} XLM</span>
              </>
            )}
          </span>
        )}
      </div>
    </nav>
  );
};

interface PageButtonProps {
  page: number;
  isActive: boolean;
  isLoading: boolean;
  onClick: (page: number) => void;
}

/**
 * Individual Page Button
 */
const PageButton: React.FC<PageButtonProps> = ({ page, isActive, isLoading, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(page);
  }, [page, onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`Go to page ${page}`}
      className={clsx(
        'inline-flex min-w-10 items-center justify-center rounded-md px-3 py-2 text-sm font-medium',
        'transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-[var(--color-theme-primary)]',
        isActive
          ? 'bg-[var(--color-theme-primary)] text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        isLoading && 'cursor-not-allowed opacity-50'
      )}
    >
      {page}
    </button>
  );
};

export default Pagination;
