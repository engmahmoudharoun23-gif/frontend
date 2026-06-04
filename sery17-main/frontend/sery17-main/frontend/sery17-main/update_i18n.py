import json

def update_json(filepath, key, value):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data[key] = value
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_translations = {
    "title": "Consultant Notes",
    "processed": "Processed",
    "underProcessing": "Under Processing",
    "writeNotePlaceholder": "Write consultant notes...",
    "helpText": "You can edit or delete the note by clearing the text and saving it.",
    "replyPrefix": "Reply:",
    "level3": "Level 3",
    "additionalReplyLabel": "Consultant Reply (Additional):",
    "writeReplyPlaceholder": "Write your reply or comment here...",
    "cancel": "Cancel",
    "replyButton": "Reply",
    "deleteReply": "Delete Reply",
    "permanentDelete": "Permanent Delete",
    "saving": "Saving...",
    "saveAndSend": "Save and Send"
}

ar_translations = {
    "title": "„·«ÕŸ«  «·«” ‘«—Ì",
    "processed": " „  «·„⁄«·Ã…",
    "underProcessing": "ﬁÌœ «·„⁄«·Ã…",
    "writeNotePlaceholder": "«ﬂ » „·«ÕŸ«  «·«” ‘«—Ì...",
    "helpText": "Ì„ﬂ‰ﬂ  ⁄œÌ· √Ê Õ–› «·„·«ÕŸ… ⁄‰ ÿ—Ìﬁ „”Õ «·‰’ ÊÕ›ŸÂ.",
    "replyPrefix": "—œ:",
    "level3": "«·„” ÊÏ «·À«·À",
    "additionalReplyLabel": " ⁄ﬁÌ» «·«” ‘«—Ì (≈÷«›Ì):",
    "writeReplyPlaceholder": "«ﬂ » —œﬂ √Ê  ⁄ﬁÌ»ﬂ Â‰«...",
    "cancel": "≈·€«¡",
    "replyButton": "—œ",
    "deleteReply": "Õ–› «·—œ",
    "permanentDelete": "Õ–› ‰Â«∆Ì",
    "saving": "Ã«—Ì «·Õ›Ÿ...",
    "saveAndSend": "Õ›Ÿ Ê≈—”«·"
}

update_json('frontend/src/i18n/locales/en.json', 'consultantNoteModal', en_translations)
update_json('frontend/src/i18n/locales/ar.json', 'consultantNoteModal', ar_translations)
print("Updated JSONs")
