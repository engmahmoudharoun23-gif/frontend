import glob
import re

files = glob.glob(r'd:\sery17-main\sery17-main\frontend\src\**\*.js', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if 'user.projects.includes' in content:
        # For ReportForm.js:
        # if (!user.projects || user.projects.length === 0 || user.projects.includes(project)) {
        content = re.sub(r'if \(!user\.projects \|\| user\.projects\.length === 0 \|\| user\.projects\.includes\(project\)\) \{',
                         r'if (true) {', content)
                         
        # For simple filters:
        # list = list.filter(p => user.projects.includes(p));
        # projects = projects.filter(p => user.projects.includes(p));
        # projects = allProjects.filter(p => user.projects.includes(p.name));
        content = re.sub(r'list = list\.filter\(p => user\.projects\.includes\(p\)\);',
                         r'/* removed redundant filter */', content)
        content = re.sub(r'projects = projects\.filter\(p => user\.projects\.includes\(p\)\);',
                         r'/* removed redundant filter */', content)
                         
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)

print("Finished patching frontend files.")
