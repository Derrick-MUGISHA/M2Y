"use client"

import { useState } from "react"
import { useLoading } from "@/contexts/loading-context"
import { useToast } from "@/hooks/use-toast"

interface UseSubmitOptions {
  loadingMessage?: string
  successMessage?: string
  errorMessage?: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useSubmit(options: UseSubmitOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showLoading, hideLoading } = useLoading()
  const { toast } = useToast()

  const {
    loadingMessage = "Processing...",
    successMessage,
    errorMessage = "An error occurred. Please try again.",
  } = options

  const submit = async (
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
    data?: any,
    headers?: HeadersInit,
  ) => {
    setIsSubmitting(true)
    showLoading(loadingMessage)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        ...(data && { body: JSON.stringify(data) }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Request failed")
      }

      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        })
      }

      if (options.onSuccess) {
        options.onSuccess(result)
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(errorMessage)

      toast({
        title: "Error",
        description: error.message || errorMessage,
        variant: "destructive",
      })

      if (options.onError) {
        options.onError(error)
      }

      throw error
    } finally {
      setIsSubmitting(false)
      hideLoading()
    }
  }

  const submitForm = async (url: string, formData: FormData, method: "POST" | "PUT" = "POST") => {
    setIsSubmitting(true)
    showLoading(loadingMessage)

    try {
      const response = await fetch(url, {
        method,
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Request failed")
      }

      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        })
      }

      if (options.onSuccess) {
        options.onSuccess(result)
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(errorMessage)

      toast({
        title: "Error",
        description: error.message || errorMessage,
        variant: "destructive",
      })

      if (options.onError) {
        options.onError(error)
      }

      throw error
    } finally {
      setIsSubmitting(false)
      hideLoading()
    }
  }

  return { submit, submitForm, isSubmitting }
}

