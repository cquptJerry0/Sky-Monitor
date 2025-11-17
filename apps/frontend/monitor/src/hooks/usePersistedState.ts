import { useState, useEffect, useCallback } from 'react'

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch (error) {
            console.error(`Failed to load persisted state for key "${key}":`, error)
            return defaultValue
        }
    })

    const setPersistedState = useCallback(
        (value: T | ((prev: T) => T)) => {
            setState(prevState => {
                const newState = value instanceof Function ? value(prevState) : value
                try {
                    localStorage.setItem(key, JSON.stringify(newState))
                } catch (error) {
                    console.error(`Failed to persist state for key "${key}":`, error)
                }
                return newState
            })
        },
        [key]
    )

    return [state, setPersistedState]
}
