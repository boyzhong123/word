/**
 * Add 词汇 section under each existing unit (子单元 = 章节层).
 * Paste in CMS console on courseId=637 detail page.
 */
(async function addYilin4aSections() {
  const SECTION = '词汇';
  const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
  if (!tree) {
    console.error('zTree not found');
    return;
  }

  const courseId = Number(
    window.bookId || new URLSearchParams(location.search).get('courseId')
  );
  const book = tree.getNodesByFilter(
    n => n.type === 'book' && /四上/.test(n.name || n.oldName || ''),
    true
  );
  if (!book) {
    console.error('四上 book not found');
    return;
  }

  tree.expandNode(book, true, false, false);
  const units = tree.getNodesByFilter(n => n.type === 'unit' && n.getParentNode()?.id === book.id);

  if (!units.length) {
    console.error('no units under book — create units first');
    return;
  }

  const addSection = body =>
    new Promise(resolve => Ajax.sectionupdateCourse(body, resolve));

  for (const unit of units) {
    const fresh = tree.getNodeByParam('id', unit.id, book);
    const kids = (fresh && fresh.children) || unit.children || [];
    if (kids.some(s => (s.name || s.oldName) === SECTION)) {
      console.log('skip (has section)', unit.name);
      continue;
    }

    const res = await addSection({
      courseId,
      bookId: book.id,
      bookType: book.book_type,
      unitId: unit.id,
      name: SECTION,
    });
    if (res.result !== 1) {
      console.error('failed', unit.name, res);
      continue;
    }

    const sec = res.info.section;
    sec.type = 'section';
    sec.isVisiable = 1;
    tree.addNodes(fresh || unit, sec);
    console.log('section added', unit.name, '→', SECTION, sec.id);
  }

  tree.expandAll(true);
  console.log('done — expand unit, click 词汇, then 文本录入');
})();
