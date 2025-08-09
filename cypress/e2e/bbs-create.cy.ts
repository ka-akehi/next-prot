describe('BBS: createPost (happy path)', () => {
  beforeEach(() => {
    cy.loginAsTestUser(); // /api/test-login を呼ぶカスタムコマンド
    cy.resetData(); // /api/test-reset でテストユーザーの投稿を初期化
    cy.visit('/bbs'); // 投稿フォームと一覧があるページ
  });

  it('フォームから投稿を作成し、一覧に反映される', () => {
    const body = `E2E create ${Date.now()}`;

    // 作成フォームにスコープして入力→送信
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(body);
      cy.get('[data-testid="submit-post"]').click();
    });

    // 失敗していないこと（バリデーション/エラーなし）
    cy.get('[data-testid="post-error"]').should('not.exist');

    // 投稿本文が一覧に表示されること
    cy.contains('[data-testid="post-content"]', body).should('exist');
  });
});
