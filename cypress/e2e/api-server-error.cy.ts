describe('API: test-server-error', () => {
  it('500: cause="throw" でサーバ例外を返す', () => {
    cy.request<{ ok: boolean; error: { code: string; message: string } }>({
      method: 'POST',
      url: '/api/test-server-error',
      body: { cause: 'throw' },
      failOnStatusCode: false, // 5xxでCypressが即failしないように
    }).then((res) => {
      expect(res.status).to.eq(500);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body.ok).to.eq(false);
      expect(res.body.error.code).to.eq('INTERNAL_ERROR');
      expect(res.body.error.message).to.match(/unexpected error/i);
    });
  });

  it('200: 正常呼び出しで ok を返す', () => {
    cy.request<{ ok: boolean; data: { status: string } }>({
      method: 'POST',
      url: '/api/test-server-error',
      body: {}, // cause なし
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body.ok).to.eq(true);
      expect(res.body.data.status).to.eq('ok');
    });
  });
});
