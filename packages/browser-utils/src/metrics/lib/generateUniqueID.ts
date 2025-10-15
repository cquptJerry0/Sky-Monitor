/**
 * Performantly generate a unique, 30-char string by combining a version
 * number, the current timestamp with a 13-digit number integer.
 * @return {string}
 */
export const generateUniqueID = () => {
    return `v4-${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`
}
