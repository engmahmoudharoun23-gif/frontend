import os

def main():
    src = os.path.join('d:\\', 'sery17-main', 'sery17-main', 'frontend', 'src', 'pages', 'SafetyReports.js')
    dest = os.path.join('d:\\', 'sery17-main', 'sery17-main', 'frontend', 'src', 'pages', 'WorkPermits.js')
    
    with open(src, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace components/names
    content = content.replace("SafetyReports", "WorkPermits")
    content = content.replace("safetyReports", "workPermits")
    content = content.replace("safety_reports", "work_permits")
    content = content.replace("safety_report", "work_permit")
    content = content.replace("SafetyReport", "WorkPermit")
    content = content.replace("safety-reports", "work-permits")
    
    # 2. Add the link back to SafetyReports
    # Locate the header buttons
    add_btn = "<Plus className=\"w-5 h-5\" /> {t('workPermits.addNew')}"
    if add_btn in content:
        # We'll add a Link next to it
        header_buttons = '''
            <div className="flex gap-3">
              <Link to="/safety-reports" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200">
                <FileText className="w-5 h-5" /> {t('workPermits.goToSafety', { defaultValue: 'تقارير السلامة' })}
              </Link>
              <button
                onClick={() => {
'''
        # Let's replace the whole button block by finding where it starts
        # We need a regex or simple replace
        pass

    # Save to WorkPermits.js
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Created WorkPermits.js")

if __name__ == "__main__":
    main()
