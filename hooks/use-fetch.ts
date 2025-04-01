"use client"

import { useState, useEffect } from "react"
import { useLoading } from "@/contexts/loading-context"

interface UseFetchOptions {
  loadingMessage?: string
  showLoading?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useFetch<T = any>(url: string, options: UseFetchOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showLoading, hideLoading } = useLoading()

  const { loadingMessage = "Loading data...", showLoading: shouldShowLoading = true } = options

  const fetchData = async () => {
    setIsLoading(true)
    if (shouldShowLoading) {
      showLoading(loadingMessage)
    }

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const result = await response.json()
      setData(result)

      if (options.onSuccess) {
        options.onSuccess(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"))

      if (options.onError) {
        options.onError(err instanceof Error ? err : new Error("An error occurred"))
      }
    } finally {
      setIsLoading(false)
      if (shouldShowLoading) {
        hideLoading()
      }
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const refetch = () => {
    fetchData()
  }

  return { data, error, isLoading, refetch }
}

