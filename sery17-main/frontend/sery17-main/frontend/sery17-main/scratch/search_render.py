with open("d:/sery17-main/sery17-main/frontend/src/pages/Users.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

out_lines = []
for idx, line in enumerate(lines):
    if "users.map" in line or "map(user" in line or "created_by" in line or "مستوى" in line or "role" in line or "level" in line:
        out_lines.append(f"Line {idx+1}: {line.strip()}")

with open("d:/sery17-main/sery17-main/scratch/search_render_results.txt", "w", encoding="utf-8") as f_out:
    f_out.write("\n".join(out_lines))

print("Results written to scratch/search_render_results.txt")
