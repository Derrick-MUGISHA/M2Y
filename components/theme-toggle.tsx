"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor, Palette } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useProfile } from "@/hooks/use-profile"
import { useEffect } from "react"

interface UserProfile {
  id: string
  name: string
  email: string
  image: string
  theme: "light" | "dark" | "system"
  chatBackground: "light" | "dark" | "gradient"
}

// Ensure the object includes 'chatBackground'
const user: UserProfile = {
  id: "1",
  name: "Alice",
  email: "alice@example.com",
  image: "profile.jpg",
  theme: "light",
  chatBackground: "light" // Must be provided!
}

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { profile, updateProfile } = useProfile()

  // Sync theme with user profile
  useEffect(() => {
    if (profile && profile.theme !== theme) {
      setTheme(profile.theme)
    }
  }, [profile, setTheme, theme])

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)

    if (profile) {
      await updateProfile({ theme: newTheme })
    }
  }

  const handleChatBackgroundChange = async (background: "light" | "dark" | "gradient") => {
    if (profile) {
      interface Profile {
        name?: string;
        location?: string;
        theme?: "light" | "dark" | "system";
        chatBackground?: "light" | "dark" | "gradient";  // Add this line
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          <Monitor className="h-4 w-4 mr-2" />
          System
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="h-4 w-4 mr-2" />
            Chat Background
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={profile?.chatBackground || "light"}
              onValueChange={(value) => handleChatBackgroundChange(value as "light" | "dark" | "gradient")}
            >
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="gradient">Gradient</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

