describe('BBS: deletePost (happy path)', () => {
  beforeEach(() => {
    cy.loginAsTestUser(); // /api/test-login
    cy.resetData(); // /api/test-reset
    cy.visit('/bbs');
  });

  it('既存投稿を削除して一覧から消える', () => {
    const body = `E2E delete ${Date.now()}`;

    // 1件作成
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(body);
      cy.get('[data-testid="submit-post"]').click();
    });
    cy.contains('[data-testid="post-content"]', body).should('exist');

    // data-cy（postId）を取得
    cy.contains('[data-testid="post-content"]', body)
      .closest('[data-testid="post-item"]')
      .invoke('attr', 'data-cy')
      .then((postId) => {
        // 削除ボタンをクリック
        cy.get(`[data-cy="${postId}"] [data-testid="delete-post"]`).click();

        // 確認ダイアログがある場合は承認
        cy.on('window:confirm', () => true);

        // 削除後、同じ投稿が存在しないことを確認
        cy.get(`[data-cy="${postId}"] [data-testid="post-content"]`).should('not.exist');
      });
  });
});
