with open("d:/sery17-main/sery17-main/frontend/src/pages/NewDashboard.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("d:/sery17-main/sery17-main/scratch/dashboard_cards_code.txt", "w", encoding="utf-8") as out:
    for k in range(1190, min(1380, len(lines))):
        out.write(f"{k+1}: {lines[k]}")
