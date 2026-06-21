import json

# Arabic localization
with open('frontend/src/i18n/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

# 1. Add to permissionsList
if "users" in ar and "permissionsList" in ar["users"]:
    ar["users"]["permissionsList"]["business_reports"] = "تقارير الأعمال"

# 2. Add sidebar item if exists
if "sidebar" in ar:
    ar["sidebar"]["business_reports"] = "تقارير الأعمال"

# 3. Add businessReports translations block
ar["businessReports"] = {
    "title": "تقارير الأعمال",
    "subTitle": "إدارة وعرض تقارير الأعمال للمشاريع",
    "addNew": "إضافة تقرير الأعمال",
    "editReport": "تعديل تقرير الأعمال",
    "filterTitle": "تصفية النتائج:",
    "searchBtn": "بحث",
    "resetBtn": "إعادة تعيين",
    "loading": "جاري التحميل...",
    "noReports": "لا توجد تقارير أعمال مسجلة",
    "noFilteredReports": "لا توجد تقارير مطابقة للفلاتر المحددة",
    "resetFilters": "إعادة تعيين الفلاتر",
    "dateFrom": "من تاريخ",
    "dateTo": "إلى تاريخ",
    "governorate": "المحافظة",
    "project": "المشروع",
    "notes": "الملاحظات",
    "file": "الملف المرفق",
    "addedBy": "بواسطة",
    "actions": "إجراءات",
    "viewDetails": "عرض التفاصيل",
    "edit": "تعديل التقرير",
    "delete": "حذف التقرير",
    "downloadReport": "تحميل التقرير",
    "viewReport": "عرض التقرير",
    "downloadSuccess": "تم تحميل التقرير بنجاح",
    "downloadError": "حدث خطأ أثناء تحميل التقرير",
    "preparingDownload": "جاري إعداد التقرير للتحميل...",
    "deleteConfirm": "هل تريد حذف هذا التقرير؟",
    "deleteSuccess": "تم الحذف بنجاح",
    "deleteError": "فشل في الحذف",
    "saveSuccess": "تم الحفظ بنجاح",
    "updateSuccess": "تم التحديث بنجاح",
    "uploadingFile": "⏳ جاري رفع الملف...",
    "selectFile": "رفع ملف (PDF, PPT, Image)",
    "selectProject": "اختر المشروع",
    "selectGov": "اختر المحافظة",
    "saveBtn": "إضافة التقرير",
    "saveChangesBtn": "حفظ التعديلات",
    "cancel": "إلغاء",
    "detailsTitle": "تفاصيل تقرير الأعمال",
    "close": "إغلاق",
    "notesTitle": "ملاحظات التقرير"
}

with open('frontend/src/i18n/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar, f, indent=2, ensure_ascii=False)


# English localization
with open('frontend/src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

# 1. Add to permissionsList
if "users" in en and "permissionsList" in en["users"]:
    en["users"]["permissionsList"]["business_reports"] = "Business Reports"

# 2. Add sidebar item if exists
if "sidebar" in en:
    en["sidebar"]["business_reports"] = "Business Reports"

# 3. Add businessReports translations block
en["businessReports"] = {
    "title": "Business Reports",
    "subTitle": "Manage and view project business reports",
    "addNew": "Add Business Report",
    "editReport": "Edit Business Report",
    "filterTitle": "Filter Results:",
    "searchBtn": "Search",
    "resetBtn": "Reset",
    "loading": "Loading...",
    "noReports": "No business reports registered",
    "noFilteredReports": "No reports match the selected filters",
    "resetFilters": "Reset Filters",
    "dateFrom": "From Date",
    "dateTo": "To Date",
    "governorate": "Governorate",
    "project": "Project",
    "notes": "Notes",
    "file": "Attached File",
    "addedBy": "Added By",
    "actions": "Actions",
    "viewDetails": "View Details",
    "edit": "Edit Report",
    "delete": "Delete Report",
    "downloadReport": "Download Report",
    "viewReport": "View Report",
    "downloadSuccess": "Report downloaded successfully",
    "downloadError": "Error downloading report",
    "preparingDownload": "Preparing report...",
    "deleteConfirm": "Do you want to delete this report?",
    "deleteSuccess": "Deleted successfully",
    "deleteError": "Failed to delete",
    "saveSuccess": "Saved successfully",
    "updateSuccess": "Updated successfully",
    "uploadingFile": "⏳ Uploading file...",
    "selectFile": "Upload File (PDF, PPT, Image)",
    "selectProject": "Select Project",
    "selectGov": "Select Governorate",
    "saveBtn": "Add Report",
    "saveChangesBtn": "Save Changes",
    "cancel": "Cancel",
    "detailsTitle": "Business Report Details",
    "close": "Close",
    "notesTitle": "Report Notes"
}

with open('frontend/src/i18n/locales/en.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=2, ensure_ascii=False)

print("Localization JSONs updated successfully!")
