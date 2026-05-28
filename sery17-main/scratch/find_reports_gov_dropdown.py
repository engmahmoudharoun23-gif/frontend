def analyze_file(filepath):
    print(f"=== ANALYZING {filepath} ===")
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    for idx, line in enumerate(lines):
        if "governorate" in line.lower() or "gov" in line.lower():
            if "option" in line.lower() or "select" in line.lower():
                print(f"Line {idx+1}: {line.strip()}")

analyze_file("d:/sery17-main/sery17-main/frontend/src/pages/Reports.js")
