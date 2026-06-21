import re

def check_divs(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex for <div> and </div>
    open_divs = len(re.findall(r'<div', content))
    close_divs = len(re.findall(r'</div', content))
    
    print(f"Open divs: {open_divs}")
    print(f"Close divs: {close_divs}")
    if open_divs != close_divs:
        print(f"Mismatch: {open_divs - close_divs}")

if __name__ == "__main__":
    check_divs('d:/sery17-main/sery17-main/frontend/src/pages/NewDashboard.js')
