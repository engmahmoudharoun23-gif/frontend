def check_brackets(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    for i, char in enumerate(content):
        if char == '{':
            stack.append(('{', i))
        elif char == '}':
            if not stack:
                print(f"Extra '}}' at index {i}")
            else:
                stack.pop()
    
    if stack:
        print(f"Unclosed brackets: {len(stack)}")
        for b, i in stack[-5:]:
            print(f"Unclosed '{b}' at index {i}")
    else:
        print("All curly brackets balanced.")

if __name__ == "__main__":
    check_brackets('d:/sery17-main/sery17-main/frontend/src/pages/NewDashboard.js')
