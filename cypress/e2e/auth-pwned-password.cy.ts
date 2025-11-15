import { PASSWORD_ERROR_MESSAGES, REGISTER_SUCCESS_MESSAGES } from '@domain/messages/error.messages';

const COMPROMISED_PASSWORD = 'P@ssw0rd';
const COMPROMISED_PREFIX = '21BD1';
const COMPROMISED_SUFFIX = '2DC183F740EE76F27B78EB39C8AD972A757';

describe('Pwned password チェック', () => {
  beforeEach(() => {
    cy.request('POST', '/api/test-pwned-password', {
      overrides: {
        [COMPROMISED_PREFIX]: {
          [COMPROMISED_SUFFIX]: 9999,
        },
      },
    });
  });

  afterEach(() => {
    cy.request('DELETE', '/api/test-pwned-password');
    cy.clearCookies();
  });

  it('登録フローで漏えい済みパスワードを拒否する', () => {
    const email = generateEmail('register');
    const safePassword = generateSafePassword();

    cy.visit('/register');
    cy.get('#name').type('Pwned Password E2E');
    cy.get('#email').type(email);
    cy.get('#password').type(COMPROMISED_PASSWORD);
    cy.get('button[type="submit"]').click();

    cy.contains(PASSWORD_ERROR_MESSAGES.pwnedPassword).should('be.visible');

    cy.get('#password').clear().type(safePassword);
    cy.get('button[type="submit"]').click();

    cy.contains(REGISTER_SUCCESS_MESSAGES.completed, { timeout: 10000 }).should('be.visible');
    cy.location('pathname', { timeout: 15000 }).should('eq', '/bbs');
  });

  it('既存ユーザーのパスワード変更でも漏えいパスワードを拒否する', () => {
    cy.loginAsTestUser();
    cy.visit('/account/password/change');

    cy.get('#current-password').type('DummyCurrent!1');
    cy.get('#new-password').type(COMPROMISED_PASSWORD);
    cy.get('#confirm-password').type(COMPROMISED_PASSWORD);
    cy.contains('パスワードを更新する').click();

    cy.contains(PASSWORD_ERROR_MESSAGES.pwnedPassword).should('be.visible');
  });

  it('パスワード初期設定フローでも漏えいパスワードを拒否する', () => {
    const setupEmail = generateEmail('setup');

    cy.request('POST', '/api/test-password-setup', { email: setupEmail })
      .its('body')
      .then((body) => {
        const token = body.token as string;
        const email = body.email as string;
        expect(token, 'setup token').to.be.a('string').and.to.have.length.greaterThan(0);

        const query = new URLSearchParams({
          email,
          token,
          redirect: '/bbs',
        });

        cy.visit(`/account/password/new?${query.toString()}`);
        cy.get('#new-password').type(COMPROMISED_PASSWORD);
        cy.get('#confirm-password').type(COMPROMISED_PASSWORD);
        cy.contains('パスワードを更新する').click();

        cy.contains(PASSWORD_ERROR_MESSAGES.pwnedPassword).should('be.visible');
      });
  });
});

function generateEmail(prefix: string): string {
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return `${prefix}-${nonce}@example.com`;
}

function generateSafePassword(): string {
  return `Safe!Pass${Date.now()}A1`;
}
