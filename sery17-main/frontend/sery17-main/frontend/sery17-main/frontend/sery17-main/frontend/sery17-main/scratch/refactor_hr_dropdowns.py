import re

file_path = 'frontend/src/pages/HRManagement.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'DropdownMenu' not in content:
    import_statement = '''import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";\n'''
    content = content.replace('import { useTranslation }', import_statement + 'import { useTranslation }')

def replace_dropdown(match):
    buttons = match.group(1)
    
    # Remove `setActiveActionMenuId(null);` from onClicks
    buttons = buttons.replace('setActiveActionMenuId(null); ', '')
    buttons = buttons.replace('setActiveActionMenuId(null);', '')
    
    # Replace the wrapper div with DropdownMenu
    return '''<DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 focus:outline-none focus:ring-0" title={isRtl ? 'خيارات إضافية' : 'More Actions'}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-48 bg-white shadow-xl border border-slate-100 rounded-xl p-1 z-[9999]">
''' + buttons + '''
                                </DropdownMenuContent>
                              </DropdownMenu>'''

# Regex to match the custom dropdown wrapper
pattern = re.compile(r'<div className="relative flex justify-center">\s*<button[^>]*setActiveActionMenuId[^>]*>.*?</button>\s*\{activeActionMenuId === [^&]* && \(\s*<>\s*<div className="fixed inset-0[^"]*"[^>]*></div>\s*<div className=[^>]*>\s*<div className="py-1">\s*(.*?)\s*</div>\s*</div>\s*</>\s*\)\}\s*</div>', re.DOTALL)

matches = pattern.findall(content)
print(f'Found {len(matches)} custom dropdowns to replace.')

if len(matches) > 0:
    new_content = pattern.sub(replace_dropdown, content)
    
    new_content = new_content.replace('<button onClick={() => {', '<DropdownMenuItem onClick={() => {')
    new_content = new_content.replace('<button onClick={() =>', '<DropdownMenuItem onClick={() =>')
    
    # Need to be very careful replacing </button> for DropdownMenuItem
    # Only replace </button> that are followed by another DropdownMenuItem, Separator, or closing Content
    new_content = re.sub(r'</button>\s*(<DropdownMenuItem|<div className="border-t|</DropdownMenuContent)', r'</DropdownMenuItem>\n\1', new_content)
    new_content = new_content.replace('</button>\n                                </DropdownMenuContent>', '</DropdownMenuItem>\n                                </DropdownMenuContent>')
    new_content = new_content.replace('</button>\n                                      <div className="border-t border-slate-50 my-1"></div>', '</DropdownMenuItem>\n                                      <div className="border-t border-slate-50 my-1"></div>')
    
    # General cleanup for </button> inside the DropdownMenuContent
    # To be perfectly safe, I'll just regex replace `<button ... className=...>` inside `DropdownMenuContent` using a localized replace
    
    # Replace separator div
    new_content = new_content.replace('<div className="border-t border-slate-50 my-1"></div>', '<DropdownMenuSeparator className="my-1 bg-slate-100" />')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Replaced and saved successfully.')
else:
    print('Could not find matches.')
