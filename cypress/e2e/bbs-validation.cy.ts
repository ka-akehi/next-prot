describe('BBS: 異常系・バリデーション', () => {
  beforeEach(() => {
    cy.loginAsTestUser(); // /api/test-login
    cy.resetData(); // /api/test-reset
    cy.visit('/bbs');
  });

  it('【create】空投稿はエラーが表示される', () => {
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear(); // 空
      cy.get('[data-testid="submit-post"]').click();
      cy.get('[data-testid="post-error"]').should('exist'); // 文言は固定せず存在のみ
    });
  });

  it('【create】空白だけの投稿はエラーが表示される', () => {
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type('   \n  ');
      cy.get('[data-testid="submit-post"]').click();
      cy.get('[data-testid="post-error"]').should('exist');
    });
  });

  it('【edit】空で更新しようとするとエラーになり、本文は変わらない', () => {
    const before = `E2E invalid edit before ${Date.now()}`;

    // まず1件作成（成功）
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(before);
      cy.get('[data-testid="submit-post"]').click();
      cy.get('[data-testid="post-body"]').should('have.value', '');
    });
    cy.contains('[data-testid="post-content"]', before).should('exist');

    // 対象行の id（data-cy）を取得
    cy.contains('[data-testid="post-content"]', before)
      .closest('[data-testid="post-item"]')
      .invoke('attr', 'data-cy')
      .then((postId) => {
        // 編集開始 → 空で更新
        cy.get(`[data-cy="${postId}"] [data-testid="edit-post"]`).click();
        cy.get(`[data-cy="${postId}"] [data-testid="post-edit-form"]`).should('be.visible');
        cy.get(`[data-cy="${postId}"] [data-testid="post-body-edit"]`).clear(); // 空
        cy.get(`[data-cy="${postId}"] [data-testid="submit-post-edit"]`).click();

        // エラー表示（編集フォーム内 or 共通の post-error）
        cy.get(`[data-cy="${postId}"] [data-testid="post-error"]`).should('exist');

        // キャンセルボタンを押す
        cy.get(`[data-cy="${postId}"] [data-testid="cancel-edit"]`).click();

        // 編集フォームが閉じていること
        cy.get(`[data-cy="${postId}"] [data-testid="post-edit-form"]`).should('not.exist');

        // 本文は変わっていないこと（対象行内で確認）
        cy.get(`[data-cy="${postId}"] [data-testid="post-content"]`).should('contain', before);
      });
  });
});
