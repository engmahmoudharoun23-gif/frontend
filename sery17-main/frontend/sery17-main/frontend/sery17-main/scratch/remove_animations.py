with open('frontend/src/pages/NewDashboard.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<Bar dataKey="total"', '<Bar isAnimationActive={false} dataKey="total"')
content = content.replace('<Bar dataKey="fixed"', '<Bar isAnimationActive={false} dataKey="fixed"')
content = content.replace('<Bar dataKey="water"', '<Bar isAnimationActive={false} dataKey="water"')
content = content.replace('<Bar dataKey="sewage"', '<Bar isAnimationActive={false} dataKey="sewage"')
content = content.replace('<Pie\n', '<Pie isAnimationActive={false}\n')
content = content.replace('<Pie ', '<Pie isAnimationActive={false} ')

with open('frontend/src/pages/NewDashboard.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced animations!')
