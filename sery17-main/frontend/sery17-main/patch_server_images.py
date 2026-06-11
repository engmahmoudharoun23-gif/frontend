import sys

with open(r'd:\sery17-main\sery17-main\backend\server.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Add images to safety_reports create
code = code.replace(
    '"image": body.get("image", ""),',
    '"image": body.get("image", ""),\n        "images": body.get("images", []),',
)

# Add images to safety_reports update
code = code.replace(
    'if k in ["date", "project", "governorate", "notes", "image"]}',
    'if k in ["date", "project", "governorate", "notes", "image", "images"]}',
)

# Quality reports create
code = code.replace(
    'image_val = body.get("image", "")\n    if image_val',
    'image_val = body.get("image", "")\n    images_val = body.get("images", [])\n    if images_val:\n        processed_list = []\n        for img in images_val:\n            if img.startswith("data:"):\n                try:\n                    p = await process_images_for_storage([img], category="quality_reports")\n                    processed_list.append(p[0] if p else img)\n                except:\n                    processed_list.append(img)\n            else:\n                processed_list.append(img)\n        images_val = processed_list\n    if image_val',
)
code = code.replace(
    '"image": image_val,',
    '"image": image_val,\n        "images": images_val,',
)

# Warehouse visits create
code = code.replace(
    'image_val = data.get("image", "")\n    if image_val',
    'image_val = data.get("image", "")\n    images_val = data.get("images", [])\n    if images_val:\n        processed_list = []\n        for img in images_val:\n            if img.startswith("data:"):\n                try:\n                    p = await process_images_for_storage([img], category="warehouse_visits")\n                    processed_list.append(p[0] if p else img)\n                except:\n                    processed_list.append(img)\n            else:\n                processed_list.append(img)\n        images_val = processed_list\n    if image_val',
)

# Business reports create
code = code.replace(
    '"file_name": body.get("file_name", ""),',
    '"file_name": body.get("file_name", ""),\n        "files": body.get("files", []),',
)

# Business reports update
code = code.replace(
    'if k in ["date_from", "date_to", "project", "governorate", "notes", "file_url", "file_name"]}',
    'if k in ["date_from", "date_to", "project", "governorate", "notes", "file_url", "file_name", "files"]}',
)

with open(r'd:\sery17-main\sery17-main\backend\server.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Patched successfully!")
