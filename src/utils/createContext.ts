import React, { useContext } from "react"

export function createContext<T=any>(name: string) {
  const ctx = React.createContext<T | undefined>(undefined)

  const useCtx = () => {
    const c = useContext(ctx)
    if (!c) throw new Error(`${name} must be inside a provider with a value`)
    return c
  }

  return [useCtx, ctx.Provider] as const
}

