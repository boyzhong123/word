/**
 * @deprecated Use data/textbooks/yilin-4a-2024-cms/console/01-create-units.js
 * Units only — no 子单元/词汇 sections.
 */
(async function createYilin4aUnitsOnly() {
  const UNITS = [
    'Unit 1 Our school subjects',
    'Unit 2 My day',
    'Unit 3 My week',
    'Unit 4 I like sport',
    'Unit 5 Different toys, same fun',
    'Unit 6 Weather',
    'Unit 7 Seasons',
    'Unit 8 What we wear',
  ];
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

  for (const name of UNITS) {
    const exists = (book.children || []).find(u => (u.name || u.oldName) === name);
    if (exists) { console.log('exists', name); continue; }
    const res = await new Promise(r =>
      Ajax.unitupdateCourse(
        { courseId, bookId: book.id, bookType: book.book_type, name },
        r
      )
    );
    if (res.result !== 1) { console.error('failed', name, res); continue; }
    const node = res.info.unit;
    node.type = 'unit';
    node.isParent = true;
    node.children = [];
    tree.addNodes(book, node);
    console.log('created', name, node.id);
  }
  tree.expandNode(book, true, false, true);
  console.log('done');
})();
