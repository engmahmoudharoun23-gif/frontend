import sys

filepath = 'd:/sery17-main/sery17-main/backend/server.py'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

# find delete_report_notification
delete_single_start = -1
for i, line in enumerate(lines):
    if '@api_router.delete("/reports/notifications/{report_id}")' in line:
        delete_single_start = i
        break

delete_single_end = -1
for i in range(delete_single_start, len(lines)):
    if 'raise HTTPException(status_code=500, detail="فشل في حذف الإشعار")' in lines[i]:
        delete_single_end = i
        break

# find clear_all
clear_all_start = -1
for i, line in enumerate(lines):
    if '@api_router.delete("/reports/notifications/clear-all")' in line:
        clear_all_start = i
        break

clear_all_end = -1
for i in range(clear_all_start, len(lines)):
    if 'raise HTTPException(status_code=500, detail="فشل في حذف الإشعارات")' in lines[i]:
        clear_all_end = i
        break

print(f"Single: {delete_single_start} to {delete_single_end}")
print(f"Clear All: {clear_all_start} to {clear_all_end}")

if delete_single_start < clear_all_start:
    print("Swapping order...")
    # extract blocks
    single_block = lines[delete_single_start:delete_single_end+1]
    clear_all_block = lines[clear_all_start:clear_all_end+1]
    
    # replace in list
    new_lines = lines[:delete_single_start] + clear_all_block + ["", ""] + single_block + lines[clear_all_end+1:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines) + '\n')
    print("Swapped successfully.")
else:
    print("Order is already correct.")
