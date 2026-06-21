import json

def update_json(filepath, key, value):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data[key] = value
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en_translations = {
    "title": "Consultant Notes",
    "reportCount": "Reports",
    "noNotes": "No consultant notes available currently",
    "reportNumber": "Report Number",
    "project": "Project",
    "governorate": "Governorate",
    "note": "Note",
    "actions": "Actions",
    "new": "New",
    "viewReport": "View Report",
    "reply": "Reply",
    "processed": "Processed",
    "underProcessing": "Under Processing",
    "replyModalTitle": "Level 3 Reply",
    "writeReplyLabel": "Write reply or feedback here:",
    "writeReplyPlaceholder": "Write your reply to the consultant's note here...",
    "replyHelpText": "This reply will appear to Level 1 and 2 users below the consultant's note.",
    "cancel": "Cancel",
    "sendReply": "Send Reply",
    "sending": "Sending...",
    "replyPrefix": "Reply:",
    "level3": "Level 3",
    "processTooltip": "Consultant note processing status by Level 3",
    "prev": "Previous",
    "next": "Next",
    "pageInfo": "Page {current} of {total}"
}

ar_translations = {
    "title": "„·«ÕŸ«  «·«” ‘«—Ì",
    "reportCount": "»·«€",
    "noNotes": "·«  ÊÃœ „·«ÕŸ«  „‰ «·«” ‘«—Ì Õ«·Ì«",
    "reportNumber": "—ﬁ„ «·»·«€",
    "project": "«·„‘—Ê⁄",
    "governorate": "«·„Õ«›Ÿ…",
    "note": "«·„·«ÕŸ…",
    "actions": "≈Ã—«¡« ",
    "new": "ÃœÌœ",
    "viewReport": "⁄—÷ «·»·«€",
    "reply": "—œ",
    "processed": " „  «·„⁄«·Ã…",
    "underProcessing": "ﬁÌœ «·„⁄«·Ã…",
    "replyModalTitle": "—œ «·„” ÊÏ «·À«·À",
    "writeReplyLabel": "«ﬂ » «·—œ √Ê «·≈›«œ… Â‰«:",
    "writeReplyPlaceholder": "«ﬂ » —œﬂ ⁄·Ï „·«ÕŸ… «·«” ‘«—Ì Â‰«...",
    "replyHelpText": "”ÌŸÂ— Â–« «·—œ ·„” Œœ„Ì «·„” ÊÏ «·√Ê· Ê«·À«‰Ì √”›· „·«ÕŸ… «·«” ‘«—Ì.",
    "cancel": "≈·€«¡",
    "sendReply": "≈—”«· «·—œ",
    "sending": "Ã«—Ì «·≈—”«·...",
    "replyPrefix": "—œ:",
    "level3": "«·„” ÊÏ «·À«·À",
    "processTooltip": "Õ«·… „⁄«·Ã… «·„·«ÕŸ… „‰ ﬁ»· «·„” ÊÏ «·À«·À",
    "prev": "«·”«»ﬁ",
    "next": "«· «·Ì",
    "pageInfo": "’›Õ… {current} „‰ {total}"
}

update_json('frontend/src/i18n/locales/en.json', 'consultantNotesPage', en_translations)
update_json('frontend/src/i18n/locales/ar.json', 'consultantNotesPage', ar_translations)
print("Updated JSONs")
