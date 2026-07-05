/**
 * Create Lead-in / Words / Cartoon Time / Story Time under each Unit.
 * Run on https://resm.chivoxapp.com/detail.html?courseId=637 after units exist.
 */
(async function createYilin4aSections() {
  const SECTIONS = ['Lead-in', 'Words', 'Cartoon Time', 'Story Time'];
  const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
  if (!tree) return console.error('open detail page first');

  const courseId = Number(
    window.bookId || new URLSearchParams(location.search).get('courseId')
  );
  const book = tree.getNodesByFilter(
    n => n.type === 'book' && /四上/.test(n.name || n.oldName || ''),
    true
  );
  if (!book) return console.error('四上 book not found');

  tree.expandNode(book, true, false, false);
  const units = tree.getNodesByFilter(
    n => n.type === 'unit' && n.getParentNode()?.id === book.id
  );
  if (!units.length) return console.error('no units — run 01-create-units.js first');

  const addSection = body =>
    new Promise(resolve => Ajax.sectionupdateCourse(body, resolve));

  for (const unit of units) {
    const fresh = tree.getNodeByParam('id', unit.id, book) || unit;
    for (const name of SECTIONS) {
      const kids = (fresh.children || []);
      if (kids.some(s => (s.name || s.oldName) === name)) {
        console.log('exists', unit.name, '→', name);
        continue;
      }
      const res = await addSection({
        courseId,
        bookId: book.id,
        bookType: book.book_type,
        unitId: unit.id,
        name,
      });
      if (res.result !== 1) {
        console.error('failed', unit.name, name, res);
        continue;
      }
      const sec = res.info.section;
      sec.type = 'section';
      sec.isVisiable = 1;
      tree.addNodes(fresh, sec);
      console.log('created', unit.name, '→', name, sec.id);
    }
  }

  tree.expandAll(true);
  console.log('done — each unit should have Lead-in / Words / Cartoon Time / Story Time');
})();
