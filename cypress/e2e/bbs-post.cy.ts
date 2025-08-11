describe('BBS 投稿機能（createPost）', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    cy.visit('/bbs');
  });

  it('投稿を作成できる', () => {
    const bodyText = 'これはE2Eテストによる投稿です';

    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(bodyText);
      cy.get('[data-testid="submit-post"]').click();
    });

    // 投稿が表示されることを確認
    cy.contains('[data-testid="post-content"]', bodyText, { timeout: 15000 }).should('exist');

    // 投稿が自分のものかを確認（編集・削除ボタンが表示されるか）
    cy.contains('[data-testid="post-content"]', bodyText).closest('[data-testid="post-item"]').as('item');

    cy.get('@item').find('[data-testid="edit-post"]').should('be.visible');
    cy.get('@item').find('[data-testid="delete-post"]').should('be.visible');
  });

  it('空の投稿でエラーが表示される', () => {
    // 空のまま送信
    cy.get('[data-testid="post-body"]').clear();
    cy.get('[data-testid="submit-post"]').click();

    // エラー表示を確認
    cy.get('[data-testid="post-error"]').should('exist');
  });
});

describe('BBS 投稿 CRUD', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    cy.visit('/bbs');
  });

  it('create -> edit with clear -> delete', () => {
    const before = 'E2E編集前テキスト（修正版）';
    const after = 'E2E編集後テキスト（修正版）';

    // ---- create ----
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(before);
      cy.get('[data-testid="submit-post"]').click();
    });

    cy.wait(3000);
    cy.contains('[data-testid="post-item"]', before, { timeout: 20000 }).should('exist').as('postSelector');

    // ---- edit with clear ----
    cy.get('@postSelector').find('[data-testid="edit-post"]').should('be.visible').click();
    cy.get('@postSelector').find('[data-testid="post-edit-form"]').should('be.visible');

    // テキストをクリアして新しいテキストを入力
    cy.get('@postSelector')
      .find('[data-testid="post-edit-form"]')
      .within(() => {
        // cy.contains(before).closest('[data-testid="post-item"]').invoke('attr', 'data-post-id').as('postId');
        // ↑の書き方だとこの時点でテキストが新しいものに置き換わっているので、itemのエイリアスが破棄される。
        cy.get('[data-testid="post-body-edit"]').clear().type(after);
      });

    // ✅ DOMの更新を待つ
    cy.wait(1000);

    // 更新ボタンが存在することを確認してからクリック
    cy.get('@postSelector').should('contain', after);
    cy.get('@postSelector').find('[data-testid="submit-post-edit"]').should('exist').should('be.visible').click();

    // 編集完了を待機
    cy.wait(3000);

    // ---- delete ----
    cy.get('@postSelector').should('contain', after);
    cy.get('@postSelector').find('[data-testid="delete-post"]').should('be.visible').click();

    // 削除完了を待機
    cy.wait(3000);
    cy.get('@postSelector').should('not.exist');
  });

  it('編集をキャンセルできる', () => {
    const original = 'キャンセルテスト用投稿';

    // 投稿作成
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(original);
      cy.get('[data-testid="submit-post"]').click();
    });

    cy.wait(3000);
    cy.contains(original, { timeout: 20000 }).should('exist');
    cy.contains(original).closest('[data-testid="post-item"]').as('item');

    // 編集開始
    cy.get('@item').find('[data-testid="edit-post"]').click();
    cy.get('@item').find('[data-testid="post-edit-form"]').should('be.visible');

    // 編集してキャンセル（クリアしないで追記）
    cy.get('@item').find('[data-testid="post-body-edit"]').type(' 編集中');
    cy.get('@item').find('[data-testid="cancel-edit"]').click();

    // 元の内容が保持されていることを確認
    cy.get('@item').find('[data-testid="post-content"]').should('contain', original);
    cy.get('@item').find('[data-testid="post-edit-form"]').should('not.exist');
  });

  it('編集時の空テキスト挙動確認', () => {
    const original = '空テキスト挙動確認用投稿';

    // 投稿作成
    cy.get('[data-testid="post-form"]').within(() => {
      cy.get('[data-testid="post-body"]').clear().type(original);
      cy.get('[data-testid="submit-post"]').click();
    });

    cy.wait(3000);
    cy.contains('[data-testid="post-item"]', original, { timeout: 20000 }).should('exist').as('postSelector');

    cy.get('@postSelector').find('[data-testid="edit-post"]').should('be.visible').click();
    cy.get('@postSelector').find('[data-testid="post-edit-form"]').should('be.visible');

    cy.get('@postSelector')
      .find('[data-testid="post-edit-form"]')
      .within(() => {
        cy.get('[data-testid="post-body-edit"]').clear();
      });

    // ✅ DOMの更新を待つ
    cy.wait(1000);

    // 空の状態で更新ボタンをクリック（エラーが表示されるはず）
    cy.get('@postSelector').should('contain', '');
    cy.get('@postSelector').find('[data-testid="submit-post-edit"]').should('exist').should('be.visible').click();

    // エラーが表示され、編集フォームが継続されることを確認
    cy.wait(2000);
    cy.get('@postSelector').find('[data-testid="post-edit-form"]').should('exist');

    // 新しいテキストを入力してエラーがクリアされることを確認
    cy.get('@postSelector').find('[data-testid="post-body-edit"]').type('修正されたテキスト');

    // 更新ボタンで正常に保存
    cy.get('@postSelector').find('[data-testid="submit-post-edit"]').click();

    cy.wait(3000);
    cy.get('@postSelector').should('contain', '修正されたテキスト');
  });
});
