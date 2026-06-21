import os
import glob

base_dir = "C:/Users/L/.gemini/antigravity/brain/4de95926-e95f-4926-bdb4-c495c89e1850"
media_files = glob.glob(os.path.join(base_dir, "**/*.*"), recursive=True)

media_extensions = ['.png', '.jpg', '.jpeg', '.webp']
found_files = []
for f in media_files:
    ext = os.path.splitext(f)[1].lower()
    if ext in media_extensions:
        found_files.append((f, os.path.getmtime(f)))

# Sort by modification time descending
found_files.sort(key=lambda x: x[1], reverse=True)

print("Latest media files:")
for f, mtime in found_files[:10]:
    print(f"Path: {f}")
    print(f"  MTime: {mtime}")
    print("-" * 40)
