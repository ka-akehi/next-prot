export const GENERAL_ERROR_MESSAGES = {
  authRequired: 'ログインが必要です',
  server: 'サーバーエラーが発生しました',
  unknown: '不明なエラーが発生しました',
} as const;

export const POST_ERROR_MESSAGES = {
  emptyContent: '投稿内容が空です',
  createFailed: '投稿作成中にエラーが発生しました',
  createFallback: '投稿に失敗しました',
  deleteFailed: '削除に失敗しました',
  deleteUnauthorized: '削除権限がありません',
  updateUnauthorized: '編集権限がありません',
  updateFailed: '投稿の更新に失敗しました',
  validationRequired: '投稿内容を入力してください',
} as const;

export const POLL_ERROR_MESSAGES = {
  fetchFailed: '投票データの取得に失敗しました',
  voteFailed: '投票に失敗しました',
} as const;

export const PASSWORD_ERROR_MESSAGES = {
  tooShort: (minLength: number) => `パスワードは${minLength}文字以上で設定してください`,
  mismatch: 'パスワードと確認用パスワードが一致しません',
  currentRequired: '現在のパスワードを入力してください',
  updateFailed: 'パスワードの更新に失敗しました',
};

export const PASSWORD_SUCCESS_MESSAGES = {
  updated: 'パスワードを更新しました',
};

export const REGISTER_ERROR_MESSAGES = {
  failed: '登録に失敗しました',
};

export const REGISTER_SUCCESS_MESSAGES = {
  completed: '登録が完了しました。自動的にログインします。',
};

export const TWO_FACTOR_ERROR_MESSAGES = {
  invalidCode: '❌ 認証コードが正しくありません',
};
