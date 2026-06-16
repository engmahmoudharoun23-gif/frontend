/**
 * Mobile Table Helper
 * Adds data-label attributes to table cells for mobile card view
 */

export const initMobileTables = () => {
  if (!document.body.classList.contains('mobile-view')) {
    return;
  }

  // Find all tables
  const tables = document.querySelectorAll('table');
  
  tables.forEach(table => {
    // Get headers
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    
    // Apply data-label to all cells
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
  });
};

// Auto-initialize on DOM changes
export const observeMobileTables = () => {
  if (!document.body.classList.contains('mobile-view')) {
    return;
  }

  const observer = new MutationObserver(() => {
    initMobileTables();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial run
  initMobileTables();
  
  return observer;
};
