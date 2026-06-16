import os

file_path = "frontend/src/pages/Meetings.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    # Fix the typo from earlier
    'placeholder="{t("meetings.titlePlaceholder", { defaultValue: "مثال: اجتماع التنسيق الأسبوعي" })}"': 
    'placeholder={t("meetings.titlePlaceholder", { defaultValue: "مثال: اجتماع التنسيق الأسبوعي" })}',
    
    "toast.error('حدث خطأ أثناء تحميل الاجتماعات');": "toast.error(t('meetings.errorFetch', { defaultValue: 'حدث خطأ أثناء تحميل الاجتماعات' }));",
    "if (!window.confirm('هل أنت متأكد من حذف هذا الاجتماع نهائياً؟')) return;": "if (!window.confirm(t('meetings.confirmDelete', { defaultValue: 'هل أنت متأكد من حذف هذا الاجتماع نهائياً؟' }))) return;",
    "toast.success('تم حذف الاجتماع بنجاح');": "toast.success(t('meetings.successDelete', { defaultValue: 'تم حذف الاجتماع بنجاح' }));",
    "success: selectedMeeting ? 'تم تعديل الاجتماع بنجاح!' : 'تم إضافة الاجتماع بنجاح!',": "success: selectedMeeting ? t('meetings.successEdit', { defaultValue: 'تم تعديل الاجتماع بنجاح!' }) : t('meetings.successAdd', { defaultValue: 'تم إضافة الاجتماع بنجاح!' }),",
    '<Layout user={user} onLogout={onLogout} title="الاجتماعات">': '<Layout user={user} onLogout={onLogout} title={t("sidebar.meetings", { defaultValue: "الاجتماعات" })}> ',

    '<label className="block text-xs font-bold text-gray-700 mb-1.5">المحافظة التي تم فيها الاجتماع</label>': '<label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.governorate", { defaultValue: "المحافظة التي تم فيها الاجتماع" })}</label>',
    'placeholder="أدخل المحافظة التي تم فيها الاجتماع"': 'placeholder={t("meetings.governoratePlaceholder", { defaultValue: "أدخل المحافظة التي تم فيها الاجتماع" })}',
    '<label className="block text-xs font-bold text-gray-700 mb-1.5">تاريخ الاجتماع *</label>': '<label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.dateLabel", { defaultValue: "تاريخ الاجتماع *" })}</label>',
    '<label className="block text-xs font-bold text-gray-700 mb-1.5">وصف الاجتماع ومحضر الجلسة</label>': '<label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.descriptionLabel", { defaultValue: "وصف الاجتماع ومحضر الجلسة" })}</label>',
    'placeholder="اكتب تفاصيل الاجتماع هنا..."': 'placeholder={t("meetings.descriptionPlaceholder", { defaultValue: "اكتب تفاصيل الاجتماع هنا..." })}',
    'حفظ الاجتماع</>': '{t("meetings.saveMeeting", { defaultValue: "حفظ الاجتماع" })}</>',
    'تفاصيل الاجتماع': '{t("meetings.meetingDetails", { defaultValue: "تفاصيل الاجتماع" })}',
    '<span className="block text-xs font-bold text-gray-400 mb-1">تاريخ الاجتماع</span>': '<span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.date", { defaultValue: "تاريخ الاجتماع" })}</span>',
    '<span className="block text-xs font-bold text-gray-400 mb-1">نوع الاجتماع</span>': '<span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.type", { defaultValue: "نوع الاجتماع" })}</span>',
    '<span className="block text-xs font-bold text-gray-400 mb-1">المحافظة التي تم فيها الاجتماع</span>': '<span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.governorate", { defaultValue: "المحافظة التي تم فيها الاجتماع" })}</span>',
    '<span className="block text-sm font-bold text-gray-700 mb-2">وصف ومحضر الاجتماع</span>': '<span className="block text-sm font-bold text-gray-700 mb-2">{t("meetings.meetingDescription", { defaultValue: "وصف ومحضر الاجتماع" })}</span>'
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
