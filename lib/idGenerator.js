/**
 * Simple unique ID generator (no external dependency needed)
 */

let counter = 0;

export function v4Fallback() {
  counter++;
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `stop-${timestamp}-${randomPart}-${counter}`;
}
