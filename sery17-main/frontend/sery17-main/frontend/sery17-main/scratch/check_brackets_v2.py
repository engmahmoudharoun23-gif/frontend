def check_brackets_detailed(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    for line_num, line in enumerate(lines, 1):
        for char_num, char in enumerate(line, 1):
            if char == '{':
                stack.append(('{', line_num, char_num))
            elif char == '}':
                if not stack:
                    print(f"Extra '}}' at line {line_num}, col {char_num}")
                else:
                    stack.pop()
    
    if stack:
        print(f"Unclosed brackets: {len(stack)}")
        for b, ln, cn in stack:
            print(f"Unclosed '{b}' at line {ln}, col {cn}")
    else:
        print("All curly brackets balanced.")

if __name__ == "__main__":
    check_brackets_detailed('d:/sery17-main/sery17-main/frontend/src/pages/NewDashboard.js')
