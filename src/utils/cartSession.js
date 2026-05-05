export function getCartSessionKey() {
  const key = 'cartSessionKey'
  let value = localStorage.getItem(key)

  if (!value) {
    value = crypto.randomUUID()
    localStorage.setItem(key, value)
  }

  return value
}
