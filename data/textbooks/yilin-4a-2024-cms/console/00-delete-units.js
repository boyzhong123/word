/**
 * Step 0 (optional): delete all units under 牛津译林四上(24版)
 * Paste in https://resm.chivoxapp.com/detail.html?courseId=637
 */
(async function deleteYilin4aUnits() {
  const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
  if (!tree) return console.error('open detail page first');

  const book = tree.getNodesByFilter(
    n => n.type === 'book' && /四上/.test(n.name || n.oldName || ''),
    true
  );
  if (!book) return console.error('四上 book not found');

  const units = [...(book.children || [])];
  console.log('deleting', units.length, 'units...');

  const delOne = params =>
    new Promise(resolve => {
      Ajax.beforeDelunit({ unitId: params.unitId }, data => {
        if (data.result !== 1) return resolve(false);
        Ajax.deleteunit(
          { bookId: params.bookId, unitId: params.unitId },
          res => resolve(res.result === 1)
        );
      });
    });

  for (const u of units) {
    const ok = await delOne({ bookId: book.id, unitId: u.id });
    if (ok) {
      tree.removeNode(u);
      console.log('deleted', u.name || u.oldName);
    } else {
      console.error('failed', u.name || u.oldName);
    }
  }
  console.log('done');
})();
