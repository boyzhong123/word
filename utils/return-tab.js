const RETURN_TAB_ROUTES = {
  today: '/pages/today/today',
  growth: '/pages/home/home'
}

function normalizeReturnTab(value) {
  return value === 'today' ? 'today' : 'growth'
}

function returnTabUrl(value) {
  return RETURN_TAB_ROUTES[normalizeReturnTab(value)]
}

function appendReturnTabQuery(url, value) {
  if (!value) {
    return url
  }
  const sep = url.indexOf('?') >= 0 ? '&' : '?'
  return url + sep + 'returnTab=' + normalizeReturnTab(value)
}

module.exports = {
  RETURN_TAB_ROUTES,
  normalizeReturnTab,
  returnTabUrl,
  appendReturnTabQuery
}
