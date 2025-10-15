import { getNavigationEntry } from './getNavigationEntry.js'

export const getActivationStart = (): number => {
    const navEntry = getNavigationEntry()
    return (navEntry && navEntry.activationStart) || 0
}
