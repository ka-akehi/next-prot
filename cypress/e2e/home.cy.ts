describe('ホームページ表示', () => {
  it('トップページが開ける', () => {
    cy.visit('http://localhost:3000/');
    cy.contains('app/page.tsx'); // 文字列がページ内に存在するか確認
  });
});
