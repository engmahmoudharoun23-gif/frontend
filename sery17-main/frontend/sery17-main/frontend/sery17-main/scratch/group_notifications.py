import sys

file_path = 'frontend/src/components/Layout.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_block = '''                            <div className="divide-y divide-gray-100">
                              {Object.entries(
                                governorateCounts.reduce((acc, item) => {
                                  const proj = item.project || (isRtl ? 'بدون مشروع' : 'No Project');
                                  if (!acc[proj]) acc[proj] = [];
                                  acc[proj].push(item);
                                  return acc;
                                }, {})
                              ).map(([projectName, items], projectIndex) => (
                                <div key={projectIndex} className="bg-white">
                                  <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                                    <span className="text-xs font-bold text-slate-700">
                                      {translateBrandingText(projectName, isRtl)}
                                    </span>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      {items.reduce((sum, i) => sum + i.count, 0)}
                                    </span>
                                  </div>
                                  <div className="divide-y divide-gray-50">
                                    {items.map((item, idx) => (
                                      <Link
                                        key={idx}
                                        to={`/reports?license_status=review_pending&governorate=${encodeURIComponent(item.governorate)}${item.project ? `&project=${encodeURIComponent(item.project)}` : ''}`}
                                        onClick={() => {
                                          setNotificationsOpen(false);
                                        }}
                                        className="block px-4 py-3 hover:bg-blue-50 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            <div className="flex flex-col">
                                              <span className="text-sm font-medium text-gray-900">
                                                {translateBrandingText(item.governorate, isRtl)}
                                              </span>
                                            </div>
                                          </div>
                                          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                                            {item.count}
                                          </span>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>\n'''

# Replace lines 935 to 967 (0-indexed 935:968)
lines[935:968] = [new_block]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Replacement successful.")
