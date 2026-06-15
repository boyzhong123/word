function resolveLevelSort(item, unitSort, index) {
  return (item && item.unit && item.unit.sort) || unitSort || (index + 1)
}

function buildLevelNavTitle(sort) {
  return '关卡' + sort
}

function buildLevelNavSubtitle(index, total) {
  if (!total) {
    return ''
  }
  return (index + 1) + '/' + total
}

function buildLevelNav(item, index, total, options) {
  options = options || {}
  if (options.review) {
    return {
      navTitle: '错词复习',
      navSubtitle: buildLevelNavSubtitle(index, total)
    }
  }
  const sort = resolveLevelSort(item, options.unitSort, index)
  return {
    navTitle: buildLevelNavTitle(sort),
    navSubtitle: buildLevelNavSubtitle(index, total)
  }
}

module.exports = {
  resolveLevelSort,
  buildLevelNavTitle,
  buildLevelNavSubtitle,
  buildLevelNav
}
