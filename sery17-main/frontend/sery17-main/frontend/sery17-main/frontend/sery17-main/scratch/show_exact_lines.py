with open("d:/sery17-main/sery17-main/frontend/src/pages/WaterConnections.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("d:/sery17-main/sery17-main/scratch/water_select_lines.txt", "w", encoding="utf-8") as out:
    for k in range(794, 802):
        out.write(lines[k])
