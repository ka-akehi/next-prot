const SYMBOLS = new Set([
  '@',
  ',',
  '.',
  '/',
  '?',
  '!',
  '<',
  '>',
  '_',
  '-',
  '^',
  '~',
  '¥',
  '[',
  ']',
  '{',
  '}',
  ';',
  ':',
  '+',
  '*',
]);

const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const DIGIT_REGEX = /\d/;

export const MIN_PASSWORD_LENGTH = 8;

export function isPasswordComplex(password: string): boolean {
  if (!UPPERCASE_REGEX.test(password)) return false;
  if (!LOWERCASE_REGEX.test(password)) return false;
  if (!DIGIT_REGEX.test(password)) return false;

  for (const char of password) {
    if (SYMBOLS.has(char)) {
      return true;
    }
  }

  return false;
}
