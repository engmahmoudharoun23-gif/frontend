import os

def patch_download(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    old_logic = """      if (report.image.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = report.image;
        link.download = `report_attachment_${report.id || 'file'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('"""
        
    if old_logic in content:
        # We need to replace the download logic carefully
        pass
        
    # Let's replace the exact lines
    old_line1 = "link.download = `report_attachment_${report.id || 'file'}.jpg`;"
    new_line1 = """let ext = '.jpg';
        if (report.image.startsWith('data:application/pdf')) ext = '.pdf';
        else if (report.image.startsWith('data:image/png')) ext = '.png';
        link.download = `report_attachment_${report.id || 'file'}${ext}`;"""
        
    old_line2 = "link.download = `report_attachment_${report.id || 'file'}`;"
    new_line2 = """let ext = '';
        if (report.image.toLowerCase().endsWith('.pdf')) ext = '.pdf';
        else if (report.image.toLowerCase().endsWith('.png')) ext = '.png';
        else if (report.image.toLowerCase().endsWith('.jpg') || report.image.toLowerCase().endsWith('.jpeg')) ext = '.jpg';
        link.download = `report_attachment_${report.id || 'file'}${ext}`;"""

    content = content.replace(old_line1, new_line1)
    content = content.replace(old_line2, new_line2)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    base = r"d:\sery17-main\sery17-main\frontend\src\pages"
    patch_download(os.path.join(base, "SafetyReports.js"))
    patch_download(os.path.join(base, "WorkPermits.js"))
    print("Patched handleDownloadPDF successfully!")

if __name__ == "__main__":
    main()
