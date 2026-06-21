import os
import re

filepath = r"d:\sery17-main\sery17-main\frontend\src\pages\ConsultantNotes.js"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add pagination state
content = content.replace(
    "const [loading, setLoading] = useState(true);",
    "const [loading, setLoading] = useState(true);\n  \n  const [currentPage, setCurrentPage] = useState(1);\n  const itemsPerPage = 10;"
)

# Pagination logic before return
pagination_logic = '''
  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
'''
content = content.replace("  return (\n", pagination_logic)

# Replace reports.map with currentItems.map
content = content.replace("{reports.map((report) => (", "{currentItems.map((report) => (")

# Add pagination controls below table
pagination_ui = '''
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('consultantNotesPage.prev', { defaultValue: '«·”«»ﬁ' })}
                  </button>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('consultantNotesPage.next', { defaultValue: '«· «·Ì' })}
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 font-medium" dir="auto">
                      {t('consultantNotesPage.pageInfo', { current: currentPage, total: totalPages, defaultValue: ’›Õ…  „‰  })}
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          {isRtl ? (
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          )}
                        </svg>
                      </button>
                      
                      {[...Array(totalPages).keys()].map(num => (
                        <button
                          key={num + 1}
                          onClick={() => paginate(num + 1)}
                          className={elative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 }
                        >
                          {num + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          {isRtl ? (
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          )}
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          )}
'''
content = content.replace("            </div>\n          )}", pagination_ui)

# Translations
content = content.replace('title="„·«ÕŸ«  «·«” ‘«—Ì"', 'title={t("consultantNotesPage.title", { defaultValue: "„·«ÕŸ«  «·«” ‘«—Ì" })}')
content = content.replace('„·«ÕŸ«  «·«” ‘«—Ì\n          </h2>', '{t("consultantNotesPage.title", { defaultValue: "„·«ÕŸ«  «·«” ‘«—Ì" })}\n          </h2>')
content = content.replace('»·«€\n          </span>', '{t("consultantNotesPage.reportCount", { defaultValue: "»·«€" })}\n          </span>')
content = content.replace('·«  ÊÃœ „·«ÕŸ«  „‰ «·«” ‘«—Ì Õ«·Ì«', '{t("consultantNotesPage.noNotes", { defaultValue: "·«  ÊÃœ „·«ÕŸ«  „‰ «·«” ‘«—Ì Õ«·Ì«" })}')
content = content.replace('—ﬁ„ «·»·«€', '{t("consultantNotesPage.reportNumber", { defaultValue: "—ﬁ„ «·»·«€" })}')
content = content.replace('«·„‘—Ê⁄', '{t("consultantNotesPage.project", { defaultValue: "«·„‘—Ê⁄" })}')
content = content.replace('«·„Õ«›Ÿ…', '{t("consultantNotesPage.governorate", { defaultValue: "«·„Õ«›Ÿ…" })}')
content = content.replace('«·„·«ÕŸ…', '{t("consultantNotesPage.note", { defaultValue: "«·„·«ÕŸ…" })}')
content = content.replace('≈Ã—«¡« ', '{t("consultantNotesPage.actions", { defaultValue: "≈Ã—«¡« " })}')
content = content.replace('ÃœÌœ\n                            </span>', '{t("consultantNotesPage.new", { defaultValue: "ÃœÌœ" })}\n                            </span>')
content = content.replace("|| '«·„” ÊÏ «·À«·À'", "|| t('consultantNotesPage.level3', { defaultValue: '«·„” ÊÏ «·À«·À' })")
content = content.replace("—œ: {report.consultant_note_replied_by", "{t('consultantNotesPage.replyPrefix', { defaultValue: '—œ:' })} {report.consultant_note_replied_by")
content = content.replace('⁄—÷ «·»·«€', '{t("consultantNotesPage.viewReport", { defaultValue: "⁄—÷ «·»·«€" })}')
content = content.replace('—œ\n                            </button>', '{t("consultantNotesPage.reply", { defaultValue: "—œ" })}\n                            </button>')
content = content.replace("? ' „  «·„⁄«·Ã…' : 'ﬁÌœ «·„⁄«·Ã…'", "? t('consultantNotesPage.processed', { defaultValue: ' „  «·„⁄«·Ã…' }) : t('consultantNotesPage.underProcessing', { defaultValue: 'ﬁÌœ «·„⁄«·Ã…' })")
content = content.replace('title="Õ«·… „⁄«·Ã… «·„·«ÕŸ… „‰ ﬁ»· «·„” ÊÏ «·À«·À"', 'title={t("consultantNotesPage.processTooltip", { defaultValue: "Õ«·… „⁄«·Ã… «·„·«ÕŸ… „‰ ﬁ»· «·„” ÊÏ «·À«·À" })}')
content = content.replace('—œ «·„” ÊÏ «·À«·À', '{t("consultantNotesPage.replyModalTitle", { defaultValue: "—œ «·„” ÊÏ «·À«·À" })}')
content = content.replace('«ﬂ » «·—œ √Ê «·≈›«œ… Â‰«:', '{t("consultantNotesPage.writeReplyLabel", { defaultValue: "«ﬂ » «·—œ √Ê «·≈›«œ… Â‰«:" })}')
content = content.replace('placeholder="«ﬂ » —œﬂ ⁄·Ï „·«ÕŸ… «·«” ‘«—Ì Â‰«..."', 'placeholder={t("consultantNotesPage.writeReplyPlaceholder", { defaultValue: "«ﬂ » —œﬂ ⁄·Ï „·«ÕŸ… «·«” ‘«—Ì Â‰«..." })}')
content = content.replace('”ÌŸÂ— Â–« «·—œ ·„” Œœ„Ì «·„” ÊÏ «·√Ê· Ê«·À«‰Ì √”›· „·«ÕŸ… «·«” ‘«—Ì.', '{t("consultantNotesPage.replyHelpText", { defaultValue: "”ÌŸÂ— Â–« «·—œ ·„” Œœ„Ì «·„” ÊÏ «·√Ê· Ê«·À«‰Ì √”›· „·«ÕŸ… «·«” ‘«—Ì." })}')
content = content.replace('≈·€«¡\n              </button>', '{t("consultantNotesPage.cancel", { defaultValue: "≈·€«¡" })}\n              </button>')
content = content.replace("? 'Ã«—Ì «·≈—”«·...' : '≈—”«· «·—œ'", "? t('consultantNotesPage.sending', { defaultValue: 'Ã«—Ì «·≈—”«·...' }) : t('consultantNotesPage.sendReply', { defaultValue: '≈—”«· «·—œ' })")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ConsultantNotes.js")
