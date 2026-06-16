import os

file_path = "frontend/src/pages/Meetings.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    # Replace meeting.type with translations
    "{meeting.type}": "{meeting.type === 'أسبوعي' ? t('meetings.weekly', { defaultValue: 'أسبوعي' }) : meeting.type === 'شهري' ? t('meetings.monthly', { defaultValue: 'شهري' }) : meeting.type}",
    "{selectedMeeting.type}": "{selectedMeeting.type === 'أسبوعي' ? t('meetings.weekly', { defaultValue: 'أسبوعي' }) : selectedMeeting.type === 'شهري' ? t('meetings.monthly', { defaultValue: 'شهري' }) : selectedMeeting.type}",
    
    # Missing translations in View Details Modal
    '<span className="block text-xs font-bold text-gray-400 mb-1">المقاول</span>': '<span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.contractor", { defaultValue: "المقاول" })}</span>',
    '<span className="block text-xs font-bold text-gray-400 mb-1">الاستشاري</span>': '<span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.consultant", { defaultValue: "الاستشاري" })}</span>',
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Done")
