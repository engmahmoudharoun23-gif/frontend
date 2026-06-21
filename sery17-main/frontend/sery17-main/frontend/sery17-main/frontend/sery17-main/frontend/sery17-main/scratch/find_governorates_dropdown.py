def analyze_file(filepath):
    print(f"=== ANALYZING {filepath} ===")
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    for idx, line in enumerate(lines):
        if "governorate" in line.lower() or "gov" in line.lower():
            if "<select" in line.lower() or "option" in line.lower() or "label" in line.lower() or "dropdown" in line.lower():
                print(f"Line {idx+1}: {line.strip()}")
                # print 5 lines around
                for k in range(max(0, idx - 4), min(idx + 6, len(lines))):
                    print(f"  {k+1}: {lines[k].rstrip()}")
                print("-" * 30)

analyze_file("d:/sery17-main/sery17-main/frontend/src/pages/SewageConnections.js")
analyze_file("d:/sery17-main/sery17-main/frontend/src/pages/WaterConnections.js")
