describe('BBS: editPost (happy path)', () => {
  beforeEach(() => {
    cy.loginAsTestUser(); // /api/test-login
    cy.resetData(); // /api/test-reset
    cy.visit('/bbs');
  });

  it('既存投稿を編集して本文が更新される', () => {
    const before = `E2E edit before ${Date.now()}`;
    const after = `E2E edit after  ${Date.now()}`;

    // まず1件作成（作成フォームは create 用の testid を使用）
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(before);
      cy.get('[data-testid="submit-post"]').click();
    });

    // 一覧に作成した本文が表示されていること
    cy.contains('[data-testid="post-content"]', before).should('exist');

    // 対象行の post-id を取得（再レンダー対策でID指定セレクタを使う）
    cy.contains('[data-testid="post-content"]', before)
      .closest('[data-testid="post-item"]')
      .invoke('attr', 'data-cy')
      .then((postId) => {
        // 編集ボタンをクリック
        cy.get(`[data-cy="${postId}"] [data-testid="edit-post"]`).click();

        // 編集フォームの表示を確認
        cy.get(`[data-cy="${postId}"] [data-testid="post-edit-form"]`).should('be.visible');

        // 本文を更新して送信
        cy.get(`[data-cy="${postId}"] [data-testid="post-body-edit"]`).clear().type(after);
        cy.get(`[data-cy="${postId}"] [data-testid="submit-post-edit"]`).click();

        // 更新後の本文が表示され、旧本文は消えていること
        cy.get(`[data-cy="${postId}"] [data-testid="post-content"]`).should('contain', after);
        cy.get(`[data-cy="${postId}"] [data-testid="post-content"]`).should('not.contain', before);

        // 編集フォームが閉じていること（任意）
        cy.get(`[data-cy="${postId}"] [data-testid="post-edit-form"]`).should('not.exist');
      });
  });
});
