import React from 'react';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * مكون ترقيم الصفحات المشترك
 * @param {number} currentPage - الصفحة الحالية
 * @param {number} totalPages - إجمالي الصفحات
 * @param {number} totalItems - إجمالي العناصر
 * @param {number} itemsPerPage - عدد العناصر في الصفحة
 * @param {function} onPageChange - دالة تغيير الصفحة
 * @param {function} onItemsPerPageChange - دالة تغيير عدد العناصر
 * @param {array} itemsPerPageOptions - خيارات عدد العناصر في الصفحة
 * @param {string} itemLabel - اسم العنصر للعرض (مثل: بلاغ، توصيلة، فاتورة)
 */
function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 15, 20, 50, 100],
  itemLabel
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const label = itemLabel || (isRtl ? 'عنصر' : 'item');

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // إنشاء أرقام الصفحات للعرض
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // دائماً أضف الصفحة الأولى
      pages.push(1);
      
      // حساب النطاق
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // إضافة ... إذا لزم الأمر
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // دائماً أضف الصفحة الأخيرة
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-gray-50 border-t border-gray-200" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* معلومات العرض */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          {t('common.showing')} {startItem} - {endItem} {t('common.of')} {totalItems} {label}
        </span>
        
        {/* اختيار عدد العناصر */}
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-gray-600">{t('common.rowsPerPage')}:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            data-testid="items-per-page-select"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* أزرار التنقل */}
      <div className="flex items-center gap-1">
        {/* الصفحة الأولى */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={t('common.first')}
          data-testid="first-page-btn"
        >
          {isRtl ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
        
        {/* الصفحة السابقة */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          title={t('common.previous')}
          data-testid="prev-page-btn"
        >
          {isRtl ? (
            <>
              <span>{t('common.previous')}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>{t('common.previous')}</span>
            </>
          )}
        </button>
        
        {/* أرقام الصفحات */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'text-white'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
                style={currentPage === page ? { backgroundColor: 'var(--color-primary)' } : {}}
                data-testid={`page-${page}-btn`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        {/* الصفحة التالية */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          title={t('common.next')}
          data-testid="next-page-btn"
        >
          {isRtl ? (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>{t('common.next')}</span>
            </>
          ) : (
            <>
              <span>{t('common.next')}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
        
        {/* الصفحة الأخيرة */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={t('common.last')}
          data-testid="last-page-btn"
        >
          {isRtl ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default Pagination;
