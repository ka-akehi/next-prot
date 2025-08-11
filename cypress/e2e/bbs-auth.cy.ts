describe('BBS: UI認可（他人の投稿は編集/削除できない）', () => {
  beforeEach(() => {
    cy.loginAsTestUser(); // /api/test-login
    cy.resetData(); // /api/test-reset（テストユーザーの投稿を削除）
  });

  it('【edit】他人の投稿には編集ボタンが表示されず、本文は変更されない', () => {
    // 他人の投稿を用意
    cy.request('POST', '/api/test-seed-other-post', { content: 'should not edit' })
      .its('body')
      .then((seed) => {
        const otherPostId = seed.id as string;
        const original = seed.content as string;

        cy.visit('/bbs');

        // 対象行があること & 本文確認
        cy.get(`[data-cy="${otherPostId}"] [data-testid="post-content"]`).should('contain', original);

        // 編集ボタンは表示されない
        cy.get(`[data-cy="${otherPostId}"] [data-testid="edit-post"]`).should('not.exist');

        // 編集フォームも開けない（存在しないこと）
        cy.get(`[data-cy="${otherPostId}"] [data-testid="post-edit-form"]`).should('not.exist');

        // 本文は変わっていない
        cy.get(`[data-cy="${otherPostId}"] [data-testid="post-content"]`).should('contain', original);
      });
  });

  it('【delete】他人の投稿には削除ボタンが表示されず、項目は残る', () => {
    cy.request('POST', '/api/test-seed-other-post', { content: 'should not delete' })
      .its('body')
      .then((seed) => {
        const otherPostId = seed.id as string;

        cy.visit('/bbs');

        // 行が存在する
        cy.get(`[data-cy="${otherPostId}"]`).should('exist');

        // 削除ボタンは表示されない
        cy.get(`[data-cy="${otherPostId}"] [data-testid="delete-post"]`).should('not.exist');

        // エラーも当然表示されない（操作不能のため）
        cy.get(
          `[data-cy="${otherPostId}"] [data-testid="post-error-delete"], ` +
            `[data-cy="${otherPostId}"] [data-testid="post-error"]`
        ).should('not.exist');

        // 行は残っている（削除されていない）
        cy.get(`[data-cy="${otherPostId}"]`).should('exist');
      });
  });
});

describe('BBS Auth & Navigation & SSR', () => {
  beforeEach(() => {
    cy.resetData();
  });

  it('未ログイン: /bbs では投稿フォームが非表示でログイン誘導が出る', () => {
    cy.visit('/bbs');

    cy.get('[data-testid="post-form"]').should('not.exist');
    cy.get('[data-testid="post-form-gate"]').should('exist');

    cy.get('[data-testid="nav-login"]').should('exist');
    cy.get('[data-testid="nav-logout"]').should('not.exist');
    cy.get('[data-testid="nav-profile"]').should('not.exist'); // /mypage へのリンクは非表示
  });

  it('未ログイン: /mypage はゲスト向け表示（middlewareなしのためリダイレクトはしない）', () => {
    cy.visit('/mypage');

    cy.get('body').then(($b) => {
      const hasTestId = $b.find('[data-testid="mypage-guest"]').length > 0;
      if (hasTestId) {
        cy.get('[data-testid="mypage-guest"]').should('contain', 'ログインしてください');
      } else {
        cy.contains('このページを見るにはログインしてください。').should('exist');
      }
    });
  });

  it('ログイン後: /bbs でフォームが表示され、自分の投稿だけ編集/削除できる', () => {
    cy.loginAsTestUser();
    cy.visit('/bbs');

    // ヘッダー切り替え
    cy.get('[data-testid="nav-login"]').should('not.exist');
    cy.get('[data-testid="nav-logout"]').should('exist');
    cy.get('[data-testid="nav-profile"]').should('exist');

    // 投稿作成
    const myText = `auth-my-post-${Date.now()}`;
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(myText);
      cy.get('[data-testid="submit-post"]').click();
    });

    // 自分の投稿には edit/delete が出る
    cy.contains('[data-testid="post-content"]', myText)
      .parents('[data-testid="post-item"]')
      .within(() => {
        cy.get('[data-testid="edit-post"]').should('exist');
        cy.get('[data-testid="delete-post"]').should('exist');
      });
  });

  it('ログイン後: 他人の投稿には編集/削除が表示されない', () => {
    cy.loginAsTestUser();

    // 他人投稿をseedして、返ってきた id / content を使う
    cy.request('POST', '/api/test-seed-other-post')
      .its('body')
      .then((seed) => {
        const postId: string | undefined = seed.id ?? seed.postId; // どちらの型でも対応
        const content: string | undefined = seed.content; // 返ってくる場合のみ使う

        cy.visit('/bbs');

        // SSR描画待ち＋対象行の存在確認
        cy.get('[data-testid="post-item"]').should('exist');
        cy.get(`[data-cy="${postId}"]`).should('exist');

        // content が返るなら本文の一致も確認（返らない実装ならスキップしてOK）
        if (content) {
          cy.get(`[data-cy="${postId}"] [data-testid="post-content"]`).should('contain', content);
        }

        // 他人の投稿なのでアクションは表示されない
        cy.get(`[data-cy="${postId}"] [data-testid="edit-post"]`).should('not.exist');
        cy.get(`[data-cy="${postId}"] [data-testid="delete-post"]`).should('not.exist');
      });
  });

  it('ログアウト後: /mypage はゲスト向け表示に戻る', () => {
    cy.loginAsTestUser();
    cy.visit('/bbs');

    // ログアウト → 完了待ち（/bbs にリダイレクトし、ログインボタンが出るまで待つ）
    cy.get('[data-testid="nav-logout"]').click();
    cy.location('pathname').should('eq', '/bbs');
    cy.get('[data-testid="nav-login"]').should('exist'); // ← ここで未ログイン状態を確定

    // /mypage を確認
    cy.visit('/mypage');

    // testid があればそれを優先
    cy.get('body').then(($b) => {
      const hasTestId = $b.find('[data-testid="mypage-guest"]').length > 0;
      if (hasTestId) {
        cy.get('[data-testid="mypage-guest"]').should('contain', 'ログイン');
      } else {
        // 文言の揺れに強くする（句点や表現差を吸収）
        cy.contains(/ログイン.*必要|ログインしてください/).should('exist');
      }
    });

    // ヘッダーも未ログイン状態
    cy.get('[data-testid="nav-login"]').should('exist');
    cy.get('[data-testid="nav-logout"]').should('not.exist');
  });
});
