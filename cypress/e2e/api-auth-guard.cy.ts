describe('API: test-auth-guard', () => {
  it('401: 未ログイン時は UNAUTHORIZED', () => {
    cy.request<{ ok: boolean; error: { code: string; message: string } }>({
      method: 'GET',
      url: '/api/test-auth-guard',
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body.ok).to.eq(false);
      expect(res.body.error.code).to.eq('UNAUTHORIZED');
      expect(res.body.error.message).to.match(/login required/i);
    });
  });

  it('200: ログイン後は userId を返す', () => {
    cy.loginAsTestUser(); // /api/test-login でCookieセット
    cy.request<{ ok: boolean; data: { userId: string } }>({
      method: 'GET',
      url: '/api/test-auth-guard',
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body.ok).to.eq(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(res.body.data.userId).to.be.a('string').and.not.be.empty;
    });
  });
});
