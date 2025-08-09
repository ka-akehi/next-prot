/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * 開発用 test-login API を使ってテストユーザーでログインします
     */
    loginAsTestUser(): Chainable<void>;
    logout(): Chainable<void>;
    resetData(): Chainable<void>;
    getByCy(value: string): Chainable<JQuery<HTMLElement>>;
  }
}
