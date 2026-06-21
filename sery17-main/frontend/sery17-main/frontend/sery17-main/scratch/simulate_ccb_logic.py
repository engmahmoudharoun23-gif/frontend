
def simulate_export_logic(item, field_name):
    _rn = str(item.get(field_name, '') or '')
    if _rn and not _rn.startswith('CCB-'):
        _rn = f"CCB-{_rn}"
    return _rn

# Test cases
test_items = [
    {"report_number": "12345"},
    {"report_number": "CCB-67890"},
    {"ccb_report_number": "55555"},
    {"ccb_report_number": ""},
    {"ccb_report_number": None},
    {"report_number": "بلاغ-123"}
]

print("Simulating logic for Reports:")
for item in test_items:
    if "report_number" in item:
        result = simulate_export_logic(item, "report_number")
        print(f"Input: {item['report_number']} -> Output: {result}")

print("\nSimulating logic for Connections:")
for item in test_items:
    if "ccb_report_number" in item:
        result = simulate_export_logic(item, "ccb_report_number")
        print(f"Input: {item['ccb_report_number']} -> Output: {result}")
