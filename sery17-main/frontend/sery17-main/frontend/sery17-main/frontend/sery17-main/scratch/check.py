with open('frontend/src/pages/ConsultantNotes.js', 'r', encoding='utf-8') as f:
    content = f.read()
    start = content.find('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4')
    if start != -1:
        print(content[start-100:start+600])
