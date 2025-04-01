"use client"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ViewOnceToggleProps {
  isViewOnce: boolean
  onToggle: (isViewOnce: boolean) => void
}

export function ViewOnceToggle({ isViewOnce, onToggle }: ViewOnceToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-full ${isViewOnce ? "text-blue-500" : ""}`}
            onClick={() => onToggle(!isViewOnce)}
          >
            {isViewOnce ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{isViewOnce ? "View once enabled" : "View once disabled"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

