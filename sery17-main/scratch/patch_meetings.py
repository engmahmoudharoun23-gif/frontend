import os

file_path = "frontend/src/pages/Meetings.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    # Headers
    '<h1 className="text-xl font-black text-gray-900">سجل الاجتماعات</h1>': 
    '<h1 className="text-xl font-black text-gray-900">{t("meetings.title", { defaultValue: "سجل الاجتماعات" })}</h1>',
    
    '<p className="text-xs font-medium text-gray-500 mt-1">إدارة اجتماعات المقاولين والاستشاريين ({totalItems})</p>':
    '<p className="text-xs font-medium text-gray-500 mt-1">{t("meetings.subtitle", { defaultValue: "إدارة اجتماعات المقاولين والاستشاريين" })} ({totalItems})</p>',
    
    # Add Meeting Button
    '''<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة اجتماع''':
    '''<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("meetings.addMeeting", { defaultValue: "إضافة اجتماع" })}''',

    # Filters
    'placeholder="بحث في الاجتماعات..."': 'placeholder={t("meetings.search", { defaultValue: "بحث في الاجتماعات..." })}',
    '<option value="الكل">كل أنواع الاجتماعات</option>': '<option value="الكل">{t("meetings.allTypes", { defaultValue: "كل أنواع الاجتماعات" })}</option>',
    '<option value="أسبوعي">أسبوعي</option>': '<option value="أسبوعي">{t("meetings.weekly", { defaultValue: "أسبوعي" })}</option>',
    '<option value="شهري">شهري</option>': '<option value="شهري">{t("meetings.monthly", { defaultValue: "شهري" })}</option>',

    # Loading / Empty states
    '<p className="text-indigo-600 font-medium">جاري تحميل البيانات...</p>': '<p className="text-indigo-600 font-medium">{t("meetings.loading", { defaultValue: "جاري تحميل البيانات..." })}</p>',
    '<p className="text-gray-500 font-medium text-lg">لا توجد اجتماعات مسجلة حالياً</p>': '<p className="text-gray-500 font-medium text-lg">{t("meetings.noMeetings", { defaultValue: "لا توجد اجتماعات مسجلة حالياً" })}</p>',

    # Table Headers
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏷️ اسم الاجتماع</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏷️ {t("meetings.meetingName", { defaultValue: "اسم الاجتماع" })}</th>',
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📊 النوع</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📊 {t("meetings.type", { defaultValue: "النوع" })}</th>',
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📅 التاريخ</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📅 {t("meetings.date", { defaultValue: "التاريخ" })}</th>',
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏛️ المحافظة التي تم فيها الاجتماع</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏛️ {t("meetings.governorate", { defaultValue: "المحافظة التي تم فيها الاجتماع" })}</th>',
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏗️ المشروع</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏗️ {t("meetings.project", { defaultValue: "المشروع" })}</th>',
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">👷 المقاول</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">👷 {t("meetings.contractor", { defaultValue: "المقاول" })}</th>',
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">👔 الاستشاري</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">👔 {t("meetings.consultant", { defaultValue: "الاستشاري" })}</th>',
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📎 المرفقات</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📎 {t("meetings.attachments", { defaultValue: "المرفقات" })}</th>',
    '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50 w-20">⚙️ إجراءات</th>': '<th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50 w-20">⚙️ {t("meetings.actions", { defaultValue: "إجراءات" })}</th>',

    # Dropdown actions
    '''<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                عرض التفاصيل''':
    '''<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {t("meetings.viewDetails", { defaultValue: "عرض التفاصيل" })}''',
    
    '''<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  عرض الصور''':
    '''<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  {t("meetings.viewImages", { defaultValue: "عرض الصور" })}''',

    '''<svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16.5l4-4h-3v-9h-2v9H8l4 4zm9-13h-6v2h6v18H3V5.5h6v-2H3c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-18c0-1.1-.9-2-2-2z" /></svg>
                                  عرض PDF''':
    '''<svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16.5l4-4h-3v-9h-2v9H8l4 4zm9-13h-6v2h6v18H3V5.5h6v-2H3c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-18c0-1.1-.9-2-2-2z" /></svg>
                                  {t("meetings.viewPdf", { defaultValue: "عرض ال pdf" })}''',

    '''<svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    تعديل''':
    '''<svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    {t("meetings.edit", { defaultValue: "تعديل" })}''',

    '''<svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    حذف''':
    '''<svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    {t("meetings.delete", { defaultValue: "حذف" })}''',

    # Pagination
    'itemLabel="اجتماع"': 'itemLabel={t("meetings.meetingItem", { defaultValue: "اجتماع" })}',

    # Modal headers
    "{selectedMeeting ? 'تعديل الاجتماع' : 'إضافة اجتماع جديد'}": "{selectedMeeting ? t('meetings.editMeeting', { defaultValue: 'تعديل الاجتماع' }) : t('meetings.addNewMeeting', { defaultValue: 'إضافة اجتماع جديد' })}",
    
    # Form Labels
    'اسم الاجتماع *': '{t("meetings.titleLabel", { defaultValue: "اسم الاجتماع *" })}',
    'مثال: اجتماع التنسيق الأسبوعي': '{t("meetings.titlePlaceholder", { defaultValue: "مثال: اجتماع التنسيق الأسبوعي" })}',
    'نوع الاجتماع *': '{t("meetings.typeLabel", { defaultValue: "نوع الاجتماع *" })}',
    'المقاول</label>': '{t("meetings.contractorLabel", { defaultValue: "المقاول" })}</label>',
    'أدخل اسم المقاول': '{t("meetings.contractorPlaceholder", { defaultValue: "أدخل اسم المقاول" })}',
    'الاستشاري</label>': '{t("meetings.consultantLabel", { defaultValue: "الاستشاري" })}</label>',
    'أدخل اسم الاستشاري': '{t("meetings.consultantPlaceholder", { defaultValue: "أدخل اسم الاستشاري" })}',
    'التاريخ *</label>': '{t("meetings.dateLabel", { defaultValue: "التاريخ *" })}</label>',
    'المشروع *</label>': '{t("meetings.projectLabel", { defaultValue: "المشروع *" })}</label>',
    'اختر المشروع': '{t("meetings.projectPlaceholder", { defaultValue: "اختر المشروع" })}',
    'المحافظة</label>': '{t("meetings.governorateLabel", { defaultValue: "المحافظة" })}</label>',
    'المحافظة (اختياري)': '{t("meetings.governoratePlaceholder", { defaultValue: "المحافظة (اختياري)" })}',
    'تفاصيل ومخرجات الاجتماع</label>': '{t("meetings.detailsLabel", { defaultValue: "تفاصيل ومخرجات الاجتماع" })}</label>',
    'اكتب النقاط الرئيسية، القرارات، والمخرجات...': '{t("meetings.detailsPlaceholder", { defaultValue: "اكتب النقاط الرئيسية، القرارات، والمخرجات..." })}',
    'الصور</label>': '{t("meetings.imagesLabel", { defaultValue: "الصور" })}</label>',
    'مسموح بالصور وفيديو قصير (أقل من 20 ميجا)': '{t("meetings.imagesHelp", { defaultValue: "مسموح بالصور وفيديو قصير (أقل من 20 ميجا)" })}',
    'ملفات PDF</label>': '{t("meetings.pdfLabel", { defaultValue: "ملفات PDF" })}</label>',
    'اختر ملفات PDF': '{t("meetings.pdfHelp", { defaultValue: "اختر ملفات PDF" })}',
    
    # Form buttons
    '>إلغاء<': '>{t("meetings.cancel", { defaultValue: "إلغاء" })}<',
    'جاري الحفظ...': '{t("meetings.saving", { defaultValue: "جاري الحفظ..." })}',
    '>حفظ بيانات الاجتماع<': '>{t("meetings.save", { defaultValue: "حفظ بيانات الاجتماع" })}<',

    # View Modal
    'تفاصيل ومخرجات الاجتماع</h2>': '{t("meetings.detailsTitle", { defaultValue: "تفاصيل ومخرجات الاجتماع" })}</h2>',
    'لا توجد تفاصيل': '{t("meetings.noDetails", { defaultValue: "لا توجد تفاصيل" })}',

    # Sweetalert
    '"هل أنت متأكد من حذف هذا الاجتماع؟"': 't("meetings.confirmDelete", { defaultValue: "هل أنت متأكد من حذف هذا الاجتماع؟" })',
    '"تم إضافة الاجتماع بنجاح"': 't("meetings.successAdd", { defaultValue: "تم إضافة الاجتماع بنجاح" })',
    '"تم تعديل الاجتماع بنجاح"': 't("meetings.successEdit", { defaultValue: "تم تعديل الاجتماع بنجاح" })',
    '"تم حذف الاجتماع بنجاح"': 't("meetings.successDelete", { defaultValue: "تم حذف الاجتماع بنجاح" })',
    '"حدث خطأ في جلب الاجتماعات"': 't("meetings.errorFetch", { defaultValue: "حدث خطأ في جلب الاجتماعات" })',
    '"حدث خطأ في حفظ الاجتماع"': 't("meetings.errorSave", { defaultValue: "حدث خطأ في حفظ الاجتماع" })',
    '"حدث خطأ في حذف الاجتماع"': 't("meetings.errorDelete", { defaultValue: "حدث خطأ في حذف الاجتماع" })',

    # Images Modal
    'صور الاجتماع</h2>': '{t("meetings.imagesTitle", { defaultValue: "صور الاجتماع" })}</h2>',
    'متصفحك لا يدعم تشغيل الفيديو.': '{t("meetings.videoSupport", { defaultValue: "متصفحك لا يدعم تشغيل الفيديو." })}',
    'لا توجد وسائط': '{t("meetings.noMedia", { defaultValue: "لا توجد وسائط" })}',
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
