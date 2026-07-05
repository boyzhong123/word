/**
 * Step 1: create 8 units (no 子单元) under 牛津译林四上(24版)
 * Paste in https://resm.chivoxapp.com/detail.html?courseId=637
 */
(async function createYilin4aUnitsOnly() {
  const UNITS = [
  "Unit 1 Our school subjects",
  "Unit 2 My day",
  "Unit 3 My week",
  "Unit 4 I like sport",
  "Unit 5 Different toys, same fun",
  "Unit 6 Weather",
  "Unit 7 Seasons",
  "Unit 8 What we wear"
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

  const addUnit = body =>
    new Promise(resolve => Ajax.unitupdateCourse(body, resolve));

  for (const name of UNITS) {
    const exists = (book.children || []).find(
      u => (u.name || u.oldName) === name
    );
    if (exists) {
      console.log('exists', name, exists.id);
      continue;
    }
    const res = await addUnit({
      courseId,
      bookId: book.id,
      bookType: book.book_type,
      name,
    });
    if (res.result !== 1) {
      console.error('failed', name, res);
      continue;
    }
    const node = res.info.unit;
    node.type = 'unit';
    node.isParent = true;
    node.children = [];
    tree.addNodes(book, node);
    console.log('created', name, node.id);
  }

  tree.expandNode(book, true, false, true);
  console.log('done — click a unit, then run step 2 batch upload');
})();
