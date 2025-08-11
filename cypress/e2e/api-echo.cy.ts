describe('API: test-echo', () => {
  it('200: message を送ると echo を返す', () => {
    cy.request<{ ok: boolean; data: { echo: string } }>({
      method: 'POST',
      url: '/api/test-echo',
      body: { message: 'hello world' },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body.ok).to.eq(true);
      expect(res.body.data.echo).to.eq('hello world');
    });
  });

  it('400: message が欠如/空だと BAD_REQUEST', () => {
    cy.request<{ ok: boolean; error: { code: string; message: string } }>({
      method: 'POST',
      url: '/api/test-echo',
      body: {}, // message なし
      failOnStatusCode: false, // 4xx/5xxでCypressが失敗しないように
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body.ok).to.eq(false);
      expect(res.body.error.code).to.eq('BAD_REQUEST');
      expect(res.body.error.message).to.match(/message is required/i);
    });
  });
});
