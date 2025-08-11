describe('Smoke', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    cy.resetData();
  });

  it('BBSにアクセスでき、フォームが描画される', () => {
    cy.visit('/bbs');
    cy.get('[data-testid="post-form"]').should('exist');
    cy.get('[data-testid="post-body"]').should('exist');
    cy.get('[data-testid="submit-post"]').should('exist');
  });
});
