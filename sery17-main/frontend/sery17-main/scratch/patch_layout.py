import sys

layout_path = "frontend/src/components/Layout.js"
with open(layout_path, "r", encoding="utf-8") as f:
    layout_content = f.read()

chat_link = """
            {/* دردشة الفريق */}
            <Link
              to="/chat"
              onClick={() => {
                if (isMobile) setIsOpen(false);
              }}
              className={`sidebar-item ${isActive('/chat') ? 'sidebar-item-active' : 'text-gray-700'}`}
            >
              <div className="sidebar-icon-box" style={{ background: isActive('/chat') ? 'linear-gradient(to bottom right, #8b5cf6, #6366f1)' : '' }}>
                <svg className={`sidebar-icon ${isActive('/chat') ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="sidebar-text font-bold">دردشة الفريق</span>
            </Link>
"""

# Find the Dashboard link and inject Chat link after it
if "sidebar.dashboard" in layout_content and "/chat" not in layout_content:
    # We find the closing </Link> of the Dashboard section
    parts = layout_content.split("</Link>\n            )}")
    if len(parts) > 1:
        new_content = parts[0] + "</Link>\n            )}" + "\n" + chat_link + parts[1]
        with open(layout_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Layout.js patched successfully")
    else:
        print("Could not split Layout.js correctly")
else:
    print("Chat already exists or Dashboard not found")
