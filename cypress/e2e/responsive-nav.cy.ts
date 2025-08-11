describe('ResponsiveNav responsiveness', () => {
  beforeEach(() => {
    cy.visit('/responsive-test');
  });

  it('デスクトップではdesktop-navが表示され、hamburgerは非表示', () => {
    cy.viewport('macbook-15'); // 幅1440px相当
    cy.get('[data-testid="desktop-nav"]').should('be.visible');
    cy.get('[data-testid="hamburger"]').should('not.be.visible');
  });

  it('モバイルではhamburgerが表示され、desktop-navは非表示', () => {
    cy.viewport('iphone-6'); // 幅375px相当
    cy.get('[data-testid="hamburger"]').should('be.visible');
    cy.get('[data-testid="desktop-nav"]').should('not.be.visible');
  });

  it('モバイルでhamburgerを押すとメニューが開く', () => {
    cy.viewport('iphone-6');
    cy.get('[data-testid="hamburger"]').click();
    cy.get('[data-testid="mobile-menu"]').should('be.visible');
  });
});
