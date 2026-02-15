// NatureCode ASCII Art
export function getAsciiArt() {
  return [
    "  ____  ____ _/ /___  __________  _________  ____/ /__",
    " / __ \\/ __ `/ __/ / / / ___/ _ \\/ ___/ __ \\/ __  / _ \\",
    "/ / / / /_/ / /_/ /_/ / /  /  __/ /__/ /_/ / /_/ /  __/",
    "\\_\\_\\_\\__,_/\\__/\\__,_/_/   \\___/\\___/\\____/\\__,_/\\___/",
  ].join("\n");
}

export function getWelcomeArt() {
  const asciiArt = getAsciiArt();
  return `${asciiArt}

    NatureCode v1.4.7.2 - Cross-platform AI Assistant for Terminal
********************************************************************************`;
}

export function getCommandPrompt() {
  return `Available commands:
/model     - Configure AI model and API settings
/start     - Start interactive AI session  
/config    - Show current configuration
/delmodel  - Delete model configuration
/help      - Show this help message
/exit      - Exit NatureCode`;
}

export function clearScreen() {
  // Clear screen and move cursor to top
  process.stdout.write("\x1Bc");
}
