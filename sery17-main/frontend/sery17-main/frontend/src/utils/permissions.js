// أدوات مساعدة للتحقق من صلاحيات المستخدم - عامة و لكل مشروع على حدة

// قائمة الصلاحيات المرتبطة بمشروع (يمكن منحها لكل مشروع على حدة)
export const PROJECT_SCOPED_PERMISSIONS = new Set([
  'support_messages', 'trash', 'settings', 'reports_view', 'reports_add', 'reports_edit', 'reports_delete',
  'reports_review', 'reports_import', 'reports_notifications', 'consultant_notes',
  'water_connections', 'water_connections_import',
  'sewage_connections', 'sewage_connections_import',
  'invoices', 'review_invoices', 'review_invoices_3', 'view_all_invoices',
  'extracts', 'view_extracts_all',
  'employee_requests', 'review_employee_requests', 'view_all_employee_requests',
  'contractors', 'projects', 'users_manage', 'team', 'project_settings',
  'cars', 'cars_manage', 'fleet_maintenance', 'hr_management',
  'dashboard', 'safety_reports', 'quality_reports', 'business_reports',
  'safety_reports_edit', 'safety_reports_delete', 'quality_reports_edit',
  'quality_reports_delete', 'business_reports_edit', 'business_reports_delete',
  'business_reports_review',
  'work_permits', 'work_permits_edit', 'work_permits_delete'
]);

/**
 * التحقق من صلاحية عامة للمستخدم (غير مرتبطة بمشروع)
 */
export function hasPermission(user, permKey) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  const connectionFields = new Set([
    'connections_full_form', 'connections_show_phone', 'connections_show_request_number',
    'connections_show_restriction_number', 'connections_show_account_number',
    'connections_show_ccb_number', 'connections_show_ccp_number', 'connections_show_dates',
    'connections_show_measurements', 'connections_show_meter', 'connections_show_location'
  ]);
  if (connectionFields.has(permKey)) {
    return hasPermission(user, 'water_connections') || hasPermission(user, 'sewage_connections');
  }
  
  // فحص الصلاحيات العامة
  if ((user.permissions || []).includes(permKey)) return true;
  
  // فحص الصلاحيات المرتبطة بمشروع (إذا كانت موجودة في أي مشروع يملكها المستخدم)
  const pp = user.project_permissions || {};
  if (Object.values(pp).some(perms => (perms || []).includes(permKey))) return true;

  return false;
}

/**
 * التحقق من صلاحية لمستخدم في سياق مشروع محدد.
 * المنطق:
 * - Admin: دائماً true
 * - الصلاحيات غير المرتبطة بمشروع (عامة النظام): تُفحص من القائمة العامة فقط
 * - الصلاحيات المرتبطة بمشروع:
 *   • إذا كان للمستخدم project_permissions[project] محدد (غير فارغ):
 *     → تُسستخدم فقط الصلاحيات الخاصة بذلك المشروع (تتجاوز العامة لهذا المشروع)
 *   • إذا لم يكن محدداً لذلك المشروع: تُستخدم الصلاحيات العامة (backward compat)
 */
export function hasProjectPermission(user, project, permKey) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const connectionFields = new Set([
    'connections_full_form', 'connections_show_phone', 'connections_show_request_number',
    'connections_show_restriction_number', 'connections_show_account_number',
    'connections_show_ccb_number', 'connections_show_ccp_number', 'connections_show_dates',
    'connections_show_measurements', 'connections_show_meter', 'connections_show_location'
  ]);
  if (connectionFields.has(permKey)) {
    return hasProjectPermission(user, project, 'water_connections') || hasProjectPermission(user, project, 'sewage_connections');
  }
  
  const globalPerms = user.permissions || [];
  
  // للصلاحيات غير المرتبطة بمشروع: نعتمد على القائمة العامة فقط
  if (!PROJECT_SCOPED_PERMISSIONS.has(permKey)) {
    return globalPerms.includes(permKey);
  }
  
  // للصلاحيات المرتبطة بمشروع
  const pp = user.project_permissions || {};
  
  // توحيد اسم المشروع للبحث
  const normalizeArabic = (text) => {
    if (!text) return "";
    return text.toString().trim().replace(/\s+/g, " ")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  };
  
  const projNorm = normalizeArabic(project);
  const myProjKey = Object.keys(pp).find(k => normalizeArabic(k) === projNorm);
  
  if (myProjKey && Array.isArray(pp[myProjKey]) && pp[myProjKey].length > 0) {
    // المشروع يملك صلاحيات مخصصة → استخدمها حصرياً (تتجاوز العامة)
    return pp[myProjKey].includes(permKey);
  }
  
  // fallback: الصلاحيات العامة (backward compat)
  return globalPerms.includes(permKey);
}

/**
 * يعيد قائمة المشاريع التي يملك فيها المستخدم صلاحية محددة (مع منطق override لكل مشروع).
 */
export function getProjectsWithPermission(user, permKey) {
  if (!user) return [];
  const userProjects = user.projects || [];
  if (user.role === 'admin') return userProjects;
  
  const connectionFields = new Set([
    'connections_full_form', 'connections_show_phone', 'connections_show_request_number',
    'connections_show_restriction_number', 'connections_show_account_number',
    'connections_show_ccb_number', 'connections_show_ccp_number', 'connections_show_dates',
    'connections_show_measurements', 'connections_show_meter', 'connections_show_location'
  ]);
  if (connectionFields.has(permKey)) {
    const waterProjects = getProjectsWithPermission(user, 'water_connections');
    const sewageProjects = getProjectsWithPermission(user, 'sewage_connections');
    return Array.from(new Set([...waterProjects, ...sewageProjects]));
  }
  
  const globalPerms = user.permissions || [];
  const pp = user.project_permissions || {};
  
  const normalizeArabic = (text) => {
    if (!text) return "";
    return text.toString().trim().replace(/\s+/g, " ")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");
  };

  return userProjects.filter(proj => {
    const projNorm = normalizeArabic(proj);
    const myProjKey = Object.keys(pp).find(k => normalizeArabic(k) === projNorm);
    
    const projSpecific = myProjKey ? (pp[myProjKey] || []) : [];
    if (projSpecific.length > 0) {
      return projSpecific.includes(permKey);
    }
    return globalPerms.includes(permKey);
  });
}

/**
 * هل المستخدم لديه الصلاحية في أي مشروع من مشاريعه؟ (عامة أو في أي مشروع)
 */
export function hasAnyProjectPermission(user, permKey) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const connectionFields = new Set([
    'connections_full_form', 'connections_show_phone', 'connections_show_request_number',
    'connections_show_restriction_number', 'connections_show_account_number',
    'connections_show_ccb_number', 'connections_show_ccp_number', 'connections_show_dates',
    'connections_show_measurements', 'connections_show_meter', 'connections_show_location'
  ]);
  if (connectionFields.has(permKey)) {
    return hasAnyProjectPermission(user, 'water_connections') || hasAnyProjectPermission(user, 'sewage_connections');
  }

  if ((user.permissions || []).includes(permKey)) return true;
  const pp = user.project_permissions || {};
  return Object.values(pp).some(perms => (perms || []).includes(permKey));
}
