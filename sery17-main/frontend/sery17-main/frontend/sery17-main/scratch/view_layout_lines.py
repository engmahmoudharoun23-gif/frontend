with open('frontend/src/components/Layout.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- Section 1 (Mobile Menu) ---")
for idx in range(1289, min(1325, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end='')

print("\n--- Section 2 (Desktop Menu) ---")
for idx in range(1539, min(1585, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end='')
