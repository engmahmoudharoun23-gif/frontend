with open('frontend/src/pages/Users.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(109, 135):
    print(f"{i+1}: {lines[i]}", end='')
