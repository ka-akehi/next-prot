describe('ToDo: 実行速度を意識していないテスト', () => {
  it('ページ読み込み後に既存のToDoを探す', () => {
    cy.visit('/todo');

    // 状態が安定するまで固定時間待つ（非推奨）
    cy.wait(3000);

    cy.get('li').first().should('exist');
  });

  it('新しいToDoを追加できる（遅延待ちあり）', () => {
    cy.visit('/todo');
    const text = `slow todo ${Date.now()}`;

    cy.get('input[placeholder="タスクを入力"]').type(text);
    cy.contains('button', '追加').click();

    // APIレスポンス・DB反映を固定で待つ（非推奨）
    cy.wait(2000);

    cy.contains('li', text).should('be.visible');
  });
});
