import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import 'whatwg-fetch';
dotenv.config({ path: '.env' });

if (typeof setImmediate === 'undefined') {
  (global as { setImmediate?: (fn: (...args: unknown[]) => void, ...args: unknown[]) => void }).setImmediate = (
    fn: (...args: unknown[]) => void,
    ...args: unknown[]
  ) => setTimeout(fn, 0, ...args);
}
