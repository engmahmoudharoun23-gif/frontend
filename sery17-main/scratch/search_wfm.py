import io
with io.open('d:/sery17-main/sery17-main/frontend/src/pages/Reports.js', 'r', encoding='utf-8') as f:
    content = f.readlines()
with io.open('d:/sery17-main/sery17-main/scratch/temp_output.txt', 'w', encoding='utf-8') as f:
    for i, l in enumerate(content):
        if 'wfm' in l or 'مدحت' in l:
            f.write(str(i+1) + ': ' + l.strip() + '\n')
