import re
import os

filepath = r"d:\sery17-main\sery17-main\frontend\src\pages\QualityReports.js"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add activeTab state
content = content.replace("const [reports, setReports] = useState(getInitialReports);",
"""const [reports, setReports] = useState(getInitialReports);
  const [warehouseVisits, setWarehouseVisits] = useState([]);
  const [activeTab, setActiveTab] = useState('field_quality'); // 'field_quality' or 'warehouse_visits'
""")

# Modify fetchReports to fetch both
new_fetch = """  const fetchReports = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/quality-reports`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data || []);
      try { localStorage.setItem('cache_QualityReports.js_reports', JSON.stringify(res.data || [])); } catch(e) {}
      
      const resVisits = await axios.get(`${API}/warehouse-visits`, { headers: { Authorization: `Bearer ${token}` } });
      setWarehouseVisits(resVisits.data || []);
    } catch { toast.error(t('qualityReports.downloadError')); }
    finally { setLoading(false); }
  }, [t]);"""

content = re.sub(r"  const fetchReports = useCallback\(async \(\) => \{.*?\}, \[t\]\);", new_fetch, content, flags=re.DOTALL)

# Modify filtering logic
new_filter = """  const filteredReports = useMemo(() => {
    const dataList = activeTab === 'warehouse_visits' ? warehouseVisits : reports;
    return dataList.filter(r => {
      const matchDate = !appliedDate || (r.date && r.date.includes(appliedDate));
      const matchProject = !appliedProject || (r.project && r.project === appliedProject);
      const matchGov = !appliedGov || (r.governorate && r.governorate === appliedGov);
      return matchDate && matchProject && matchGov;
    });
  }, [reports, warehouseVisits, activeTab, appliedDate, appliedProject, appliedGov]);"""

content = re.sub(r"  const filteredReports = useMemo\(\(\) => \{.*?\}, \[reports, appliedDate, appliedProject, appliedGov\]\);", new_filter, content, flags=re.DOTALL)

# Reset currentPage on tab change
content = content.replace("useEffect(() => {\n    setCurrentPage(1);\n  }, [reports, appliedDate, appliedProject, appliedGov]);",
"""useEffect(() => {
    setCurrentPage(1);
  }, [reports, warehouseVisits, activeTab, appliedDate, appliedProject, appliedGov]);""")

# Modify handleReviewReport, handleRevertReview, handleSave, handleDelete
content = content.replace("await axios.put(`${API}/quality-reports/${reportId}`", "await axios.put(`${API}/${activeTab === 'warehouse_visits' ? 'warehouse-visits' : 'quality-reports'}/${reportId}`")
content = content.replace("await axios.post(`${API}/quality-reports`", "await axios.post(`${API}/${activeTab === 'warehouse_visits' ? 'warehouse-visits' : 'quality-reports'}`")
content = content.replace("await axios.delete(`${API}/quality-reports/${id}`", "await axios.delete(`${API}/${activeTab === 'warehouse_visits' ? 'warehouse-visits' : 'quality-reports'}/${id}`")

# Header modification: Add Tabs
header_html = """          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-teal-100 rounded-xl"><ClipboardCheck className="w-7 h-7 text-teal-600" /></span>
              {t('qualityReports.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1 mr-12">{t('qualityReports.subTitle')}</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium shadow-md transition-all"
          >
            <Plus className="w-5 h-5" /> {activeTab === 'warehouse_visits' ? t('qualityReports.addWarehouseVisit') : t('qualityReports.addNew')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('field_quality')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'field_quality' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {t('qualityReports.fieldQualityReportsTab')}
          </button>
          <button
            onClick={() => setActiveTab('warehouse_visits')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'warehouse_visits' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {t('qualityReports.warehouseVisitsTab')}
          </button>
        </div>"""

content = re.sub(r"          <div>\s*<h1 className=\"text-2xl font-bold text-gray-900 flex items-center gap-3\">.*?</button>\s*</div>", header_html, content, flags=re.DOTALL)

# Change noReports text
content = content.replace("{t('qualityReports.noReports')}", "{activeTab === 'warehouse_visits' ? t('qualityReports.noWarehouseVisits') : t('qualityReports.noReports')}")

# Add modal title changes
content = content.replace("{editingReport ? t('qualityReports.editReport') : t('qualityReports.addNew')}",
"{editingReport ? (activeTab === 'warehouse_visits' ? t('qualityReports.editWarehouseVisit') : t('qualityReports.editReport')) : (activeTab === 'warehouse_visits' ? t('qualityReports.addWarehouseVisit') : t('qualityReports.addNew'))}")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
