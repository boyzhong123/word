  assert.match(homeTemplate, /url="{{unit\.cardMonsterSprite}}"/)
  assert.match(homeStyle, /\.day-task-row \.task-card\s*{[^}]*height:\s*122rpx/s)
  assert.match(homeStyle, /\.day-task-row \.task-name\s*{[^}]*font-size:\s*25rpx/s)
})

test('day view keeps sidebar and content scrolling independently', () => {
  assert.match(homeTemplate, /class="day-layout" style="height: {{dayLayoutHeight}}px;"/)
  assert.match(homeTemplate, /class="day-sidebar-shell /)
  assert.match(homeTemplate, /headerPinned \? stickyClusterHeight : 0/)
  assert.match(homeTemplate, /class="day-sidebar"[\s\S]*style="height: {{dayLayoutHeight}}px;"/)
  assert.match(homeTemplate, /scroll-y[\s\S]*class="day-content"[\s\S]*style="height: {{dayLayoutHeight}}px;"/)
  assert.match(homeScript, /dayLayoutHeight/)
  assert.match(homeScript, /stickyClusterHeight/)
  assert.match(homeStyle, /\.day-layout\s*{[^}]*overflow:\s*hidden/s)
})

test('book card and learning path header pin with fixed header while scrolling', () => {
  assert.match(homeTemplate, /class="home-pinned-header /)
  assert.match(homeTemplate, /transform: translateY\({{pinnedHeaderOffset}}px\)/)
  assert.match(homeTemplate, /class="sticky-cluster-spacer"/)
  assert.match(homeTemplate, /class="book-card"/)
  assert.match(homeTemplate, /class="section-heading"/)
  assert.doesNotMatch(homeTemplate, /class="home-sticky-cluster"/)
  assert.match(homeScript, /updatePinnedHeader\(event\)/)
  assert.match(homeScript, /headerPinned/)
  assert.match(homeStyle, /\.home-pinned-header\s*{[^}]*position:\s*fixed/s)
  assert.match(homeStyle, /\.day-sidebar-shell-fixed\s*{[^}]*position:\s*fixed/s)
})

test('toggleLevelView switches between category and day layouts', () => {