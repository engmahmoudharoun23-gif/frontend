import os
import re

frontend_pages_dir = 'frontend/src/pages'

for filename in os.listdir(frontend_pages_dir):
    if not filename.endswith('.js'):
        continue
        
    filepath = os.path.join(frontend_pages_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content.replace('sessionStorage', 'localStorage')
    
    # Also, for Contractors.js, remove the dependency on projects.length > 0
    if filename == 'Contractors.js':
        # Find:
        #   useEffect(() => {
        #     if (projects.length > 0) {
        #       fetchContractors();
        #       setCurrentPage(1);
        #     }
        #   }, [projects, filterProject]);
        
        # Replace with:
        #   useEffect(() => {
        #     fetchContractors();
        #     setCurrentPage(1);
        #   }, [filterProject]);
        
        pattern = r"useEffect\(\(\) => \{\s*if \(projects\.length > 0\) \{\s*fetchContractors\(\);\s*setCurrentPage\(1\);\s*\}\s*\}, \[projects, filterProject\]\);"
        replacement = """useEffect(() => {
    fetchContractors();
    setCurrentPage(1);
  }, [filterProject]);"""
        new_content = re.sub(pattern, replacement, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filename} to use localStorage")
