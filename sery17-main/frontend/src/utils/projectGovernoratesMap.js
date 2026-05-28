// ربط المشاريع بالمحافظات
export const PROJECT_GOVERNORATES = {};

export const ALL_PROJECTS = Object.keys(PROJECT_GOVERNORATES);

// دالة للحصول على المحافظات حسب المشاريع المحددة
export const getGovernoratesByProjects = (projects) => {
  if (!projects || projects.length === 0) {
    // إذا لم يتم تحديد مشاريع، إرجاع جميع المحافظات
    return Object.values(PROJECT_GOVERNORATES).flat();
  }
  
  const governorates = [];
  projects.forEach(project => {
    if (PROJECT_GOVERNORATES[project]) {
      governorates.push(...PROJECT_GOVERNORATES[project]);
    }
  });
  
  return [...new Set(governorates)]; // إزالة التكرار
};
