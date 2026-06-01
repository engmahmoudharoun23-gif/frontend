with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the incorrect replacement inside if conditions
incorrect_pattern = '"quality_reports", "business_reports" not in user_perms'
correct_pattern = '"quality_reports" not in user_perms'

content = content.replace(incorrect_pattern, correct_pattern)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement error fixed in server.py!")
