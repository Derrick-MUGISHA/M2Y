export function cn(...inputs: any[]) {
  let twClasses = ""
  for (let i = 0; i < inputs.length; i++) {
    if (typeof inputs[i] === "string") {
      twClasses += inputs[i] + " "
    } else if (typeof inputs[i] === "object" && inputs[i] !== null) {
      for (const key in inputs[i]) {
        if (inputs[i].hasOwnProperty(key) && inputs[i][key]) {
          twClasses += key + " "
        }
      }
    }
  }
  return twClasses.trim()
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  const formattedMinutes = String(minutes).padStart(2, "0")
  const formattedSeconds = String(remainingSeconds).padStart(2, "0")
  return `${formattedMinutes}:${formattedSeconds}`
}

