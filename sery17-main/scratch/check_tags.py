import os

file_path = r"d:\sery17-main\sery17-main\frontend\src\pages\NewDashboard.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Very simple tag counter (not perfect but helpful)
open_divs = content.count("<div")
close_divs = content.count("</div")

print(f"Open divs: {open_divs}")
print(f"Close divs: {close_divs}")

open_layout = content.count("<Layout")
close_layout = content.count("</Layout")

print(f"Open Layout: {open_layout}")
print(f"Close Layout: {close_layout}")
