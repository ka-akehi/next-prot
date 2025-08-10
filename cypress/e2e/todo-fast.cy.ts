describe('ToDo: 実行速度を意識したテスト', () => {
  beforeEach(() => {
    // DB初期化とシード
    cy.request('POST', '/api/test-seed-todo', { title: 'seed todo' });
    cy.visit('/todo');
  });

  it('DBシード済みのToDoが表示される', () => {
    cy.contains('li', 'seed todo').should('be.visible');
  });

  it('新しいToDoを追加できる', () => {
    const text = `fast todo ${Date.now()}`;
    cy.get('input[placeholder="タスクを入力"]').type(text);
    cy.contains('button', '追加').click();

    cy.contains('li', text).should('be.visible');
  });
});
