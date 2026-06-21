import os
import re

directory = 'd:/sery17-main/sery17-main/frontend/src/pages'

# Patterns to match exactly `grid-cols-X` when it's not preceded by a breakpoint (sm:, md:, lg:, xl:, 2xl:)
# Note: we need to handle cases like `grid grid-cols-2 gap-4` -> `grid grid-cols-1 sm:grid-cols-2 gap-4`

def make_responsive(match):
    prefix = match.group(1)
    cols = match.group(2)
    # Check if prefix already contains a breakpoint
    if re.search(r'(sm:|md:|lg:|xl:|2xl:)$', prefix):
        return match.group(0) # Do not modify
    return f"{prefix}grid-cols-1 sm:grid-cols-{cols}"

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Regex to find `grid-cols-X` where X is a number
            # We look for whitespace or quote before it
            # (?<=\s|")grid-cols-(\d+)(?=\s|")
            
            # Wait, `grid-cols-2` could be part of `md:grid-cols-2`.
            # So we match `(^|[\s"'])grid-cols-(\d+)`
            # And replace with `\1grid-cols-1 sm:grid-cols-\2`
            
            # Let's write a safer regex
            # match `(^|[\s"'])grid-cols-(\d+)`
            def replacer(m):
                # If there's a breakpoint right before it in the string, wait, the regex won't match the breakpoint if it just matches whitespace before grid-cols-2.
                # E.g. ` md:grid-cols-2` -> the ` ` is matched, but `md:` is before `grid-cols-2`, so `[\s"']` doesn't match `md:`.
                # If it's ` md:grid-cols-2`, it will NOT match `(^|[\s"'])grid-cols-(\d+)`. That's perfect!
                # Wait, what if it's `grid-cols-2` at the beginning of className? `"grid-cols-2"` matches.
                return f"{m.group(1)}grid-cols-1 sm:grid-cols-{m.group(2)}"
            
            # Only apply this inside className="..." or className={`...`}
            # To be safe, we can just replace all occurrences of ` grid-cols-2 ` etc that are preceded by space or quote.
            new_content = re.sub(r'(^|[\s"\'`])grid-cols-([2-6])\b', replacer, content)
            
            if new_content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Made grid responsive in: {file}")
