export const maxNameLength = 50
export const maxReasonLength = 150

// characters that aren't allowed in an item name
const blockedNameChars = /[?!@#$%^*=+[\]{}<>|\\/~`_;:"]/

// trim, collapse extra spaces, capital first letter
export function tidyItemName(text) {
  const name = String(text ?? '')
    .trim()
    .replace(/\s+/g, ' ')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// returns an error message, or null if the name is fine
export function checkItemName(text) {
  const name = tidyItemName(text)

  if (name === '') {
    return 'Item name is required.'
  }
  if (name.length > maxNameLength) {
    return 'Item name must be ' + maxNameLength + ' characters or fewer.'
  }
  if (blockedNameChars.test(name)) {
    return 'Item name cannot contain special characters such as ? ! @ # $ % ^ *'
  }
  return null
}
