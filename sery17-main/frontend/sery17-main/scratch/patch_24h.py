import os

file_path = r"d:\sery17-main\sery17-main\frontend\src\pages\NewDashboard.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State change
target1 = "  const [selectedDate72h, setSelectedDate72h] = useState(''); // New State"
repl1 = "  const [selectedDate72h, setSelectedDate72h] = useState(() => new Date().toISOString().split('T')[0]); // New State"

# 2. useEffect change
target2 = """  // تعيين القيم الافتراضية لفلتر 72 ساعة بناءً على نوع المستخدم
  useEffect(() => {
    if (user && !selectedDate72h) {
      // 1. تعيين التاريخ الافتراضي لليوم ليظهر سجل 72 ساعة مباشرة عند الفتح
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate72h(today);

      // 2. التحقق من المشاريع المخصصة للمستخدم لتحديد الفئة الافتراضية (توصيلات أو بلاغات)
      const userProjects = user.projects || user.assigned_projects || [];
      const hasConnectionProject = userProjects.some(p => p === 'ايصال' || p === 'مشروع ايصال' || (p && p.includes('إيصال')));

      // جعل المشروع الافتراضي دائماً "جميع المشاريع" (قيمة فارغة)
      setSelectedProject72h('');

      if (hasConnectionProject) {
        setSelectedCategory72h('water_connections');
      } else {
        setSelectedCategory72h('reports');
      }
    }
  }, [user]);"""

repl2 = """  const [is72hInitialized, setIs72hInitialized] = useState(false);

  // تعيين القيم الافتراضية لفلتر 72 ساعة بناءً على نوع المستخدم
  useEffect(() => {
    if (user && !is72hInitialized) {
      // 1. تعيين التاريخ الافتراضي لليوم ليظهر سجل 72 ساعة مباشرة عند الفتح
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate72h(today);

      // 2. التحقق من المشاريع المخصصة للمستخدم لتحديد الفئة الافتراضية (توصيلات أو بلاغات)
      const userProjects = user.projects || user.assigned_projects || [];
      const hasConnectionProject = userProjects.some(p => p === 'ايصال' || p === 'مشروع ايصال' || (p && p.includes('إيصال')));

      // جعل المشروع الافتراضي دائماً "جميع المشاريع" (قيمة فارغة)
      setSelectedProject72h('');

      if (hasConnectionProject) {
        setSelectedCategory72h('water_connections');
      } else {
        setSelectedCategory72h('reports');
      }
      setIs72hInitialized(true);
    }
  }, [user, is72hInitialized]);"""

# 3. Excel download name
target3 = "      link.setAttribute('download', `بلاغات_72 ساعة_${selectedGovernorate72h}_${new Date().toLocaleDateString('en-GB')}.xlsx`);"
repl3 = "      link.setAttribute('download', `بلاغات_24 ساعة_${selectedGovernorate72h}_${new Date().toLocaleDateString('en-GB')}.xlsx`);"

# 4. Header label
target4 = "                  <span>{d('سجل الـ 72 ساعة الأخيرة', 'Last 72 Hours Log')}</span>"
repl4 = "                  <span>{d('سجل الـ 24 ساعة الأخيرة', 'Last 24 Hours Log')}</span>"

# 5. Governorates section
target5_1 = "({d('72 ساعة', '72 Hours')})"
repl5_1 = "({d('24 ساعة', '24 Hours')})"

target5_2 = "new Date(Date.now() - 72*60*60*1000)"
repl5_2 = "new Date(Date.now() - 24*60*60*1000)"

# 6. Governorate Counter List
target6_1 = "d('المضافة خلال 72 ساعة لكل محافظة', 'Added in Last 72 Hours by Governorate')"
repl6_1 = "d('المضافة خلال 24 ساعة لكل محافظة', 'Added in Last 24 Hours by Governorate')"

target6_2 = "d('لا توجد بلاغات جديدة خلال آخر 72 ساعة', 'No new reports during the last 72 hours')"
repl6_2 = "d('لا توجد بلاغات جديدة خلال آخر 24 ساعة', 'No new reports during the last 24 hours')"

# 7. Card footer label
target7 = """                        <div className="text-xs text-red-600 mt-1 font-medium">
                          {selectedCategory72h === 'reports' ? d('جديد خلال 72 ساعة', 'New in 72 hours') : d('جديدة خلال 72 ساعة', 'New in 72 hours')}
                        </div>"""

repl7 = """                        <div className="text-xs text-red-600 mt-1 font-medium">
                          {selectedCategory72h === 'reports' ? d('جديد خلال 24 ساعة', 'New in 24 hours') : d('جديدة خلال 24 ساعة', 'New in 24 hours')}
                        </div>"""

replacements = [
    (target1, repl1, "State"),
    (target2, repl2, "useEffect"),
    (target3, repl3, "Excel"),
    (target4, repl4, "Header"),
    (target5_1, repl5_1, "Gov Subtitle 72h"),
    (target5_2, repl5_2, "Math delta 72h"),
    (target6_1, repl6_1, "Gov List Title"),
    (target6_2, repl6_2, "Gov List Empty"),
    (target7, repl7, "Footer")
]

for target, repl, label in replacements:
    if target in content:
        content = content.replace(target, repl)
        print(f"Success: {label}")
    else:
        print(f"Fail: {label}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
