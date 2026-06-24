/** Safe .map() — coerces undefined/null to empty array. Eliminates repetition of `(items ?? [])`. */
export function safeMap<T, R>(items: T[] | undefined | null, fn: (item: T, i: number) => R): R[] {
  return (items ?? []).map(fn);
}
