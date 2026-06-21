import sys

file_path = 'frontend/src/pages/HRManagement.js'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Add import
content = "".join(lines)
if 'DropdownMenu' not in content:
    import_statement = '''import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";\n'''
    content = content.replace('import { useTranslation }', import_statement + 'import { useTranslation }')
    lines = content.splitlines(True)

new_lines = []
i = 0
count = 0

while i < len(lines):
    if '<div className="relative flex justify-center">' in lines[i] and 'setActiveActionMenuId' in "".join(lines[i:i+5]):
        count += 1
        # Start of a dropdown block
        # Find the end of this block which is the matching </div> for this <div
        div_depth = 0
        j = i
        block_lines = []
        while j < len(lines):
            line = lines[j]
            block_lines.append(line)
            div_depth += line.count('<div') - line.count('</div')
            # Wait, JSX might have <div/> or other things, but here it's pretty standard.
            if div_depth == 0 and j > i:
                break
            j += 1
        
        # block_lines now contains the whole `<div className="relative flex justify-center"> ... </div>`
        block_text = "".join(block_lines)
        
        # Extract the buttons inside `<div className="py-1">`
        # Using simple string split
        try:
            start_idx = block_text.index('<div className="py-1">') + len('<div className="py-1">')
            end_idx = block_text.rindex('</div>\n                                    </div>\n                                  </>\n                                )}')
            # Wait, there are multiple closing divs.
            # A safer way to extract buttons is just split by <div className="py-1"> and then the first </div> that closes it.
            buttons_html = block_text.split('<div className="py-1">')[1].split('</div>\n                                    </div>')[0]
            
            # Now replace `<button` with `<DropdownMenuItem`
            buttons_html = buttons_html.replace('setActiveActionMenuId(null); ', '')
            buttons_html = buttons_html.replace('setActiveActionMenuId(null);', '')
            buttons_html = buttons_html.replace('<button', '<DropdownMenuItem')
            buttons_html = buttons_html.replace('</button>', '</DropdownMenuItem>')
            buttons_html = buttons_html.replace('<div className="border-t border-slate-50 my-1"></div>', '<DropdownMenuSeparator className="my-1 bg-slate-100" />')
            
            new_block = '''<div className="flex justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 focus:outline-none focus:ring-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-52 bg-white shadow-xl border border-slate-100 rounded-xl p-1 z-[9999]">
''' + buttons_html + '''
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>\n'''
            new_lines.append(new_block)
            i = j + 1
            continue
        except Exception as e:
            print(f"Error parsing block at line {i}: {e}")
            new_lines.extend(block_lines)
            i = j + 1
            continue
    else:
        new_lines.append(lines[i])
        i += 1

print(f"Replaced {count} dropdowns.")
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

