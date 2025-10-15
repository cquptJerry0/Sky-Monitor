export const doubleRAF = (cb: () => unknown) => {
    requestAnimationFrame(() => requestAnimationFrame(() => cb()))
}
