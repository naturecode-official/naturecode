# NatureCode Windows Installer (PowerShell)
# Usage: .\install-windows.ps1

Write-Host "=== NatureCode Windows Installer ===" -ForegroundColor Cyan
Write-Host "Version: 1.4.8" -ForegroundColor Yellow
Write-Host "Repository: naturecode-official/naturecode" -ForegroundColor Yellow
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "Warning: Not running as administrator" -ForegroundColor Yellow
    Write-Host "Some operations may require elevated privileges" -ForegroundColor Yellow
    Write-Host ""
}

# System information
Write-Host "System Information:" -ForegroundColor Green
Write-Host "  OS: Windows $([Environment]::OSVersion.Version)" -ForegroundColor Gray
Write-Host "  Architecture: $([Environment]::Is64BitOperatingSystem ? 'x64' : 'x86')" -ForegroundColor Gray
Write-Host "  PowerShell: $($PSVersionTable.PSVersion)" -ForegroundColor Gray

# Check Node.js
Write-Host ""
Write-Host "Checking prerequisites..." -ForegroundColor Green

$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
} catch {
    $nodeVersion = $null
}

if ($nodeVersion) {
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  Node.js: Not installed" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  Or use the pre-built .exe file instead" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host "Continue with .exe installation? (Y/N)"
    if ($choice -notmatch "^[Yy]") {
        Write-Host "Installation cancelled" -ForegroundColor Red
        exit 1
    }
}

# Installation options
Write-Host ""
Write-Host "Installation Options:" -ForegroundColor Green
Write-Host "  1. Download pre-built .exe (Recommended for most users)" -ForegroundColor Cyan
Write-Host "  2. Install from source (Requires Node.js and Git)" -ForegroundColor Cyan
Write-Host "  3. Exit" -ForegroundColor Cyan
Write-Host ""

$option = Read-Host "Select option (1-3)"

switch ($option) {
    "1" {
        Install-Exe
    }
    "2" {
        Install-FromSource
    }
    "3" {
        Write-Host "Installation cancelled" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid option" -ForegroundColor Red
        exit 1
    }
}

function Install-Exe {
    Write-Host ""
    Write-Host "Downloading NatureCode executable..." -ForegroundColor Green
    
    $downloadUrl = "https://github.com/naturecode-official/naturecode/releases/latest/download/naturecode-win.exe"
    $targetDir = "$env:USERPROFILE\NatureCode"
    $exePath = "$targetDir\naturecode.exe"
    
    # Create directory
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    # Download executable
    try {
        Write-Host "  Downloading from: $downloadUrl" -ForegroundColor Gray
        Invoke-WebRequest -Uri $downloadUrl -OutFile $exePath -ErrorAction Stop
        Write-Host "  Downloaded to: $exePath" -ForegroundColor Green
    } catch {
        Write-Host "  Download failed: $_" -ForegroundColor Red
        Write-Host "  Please download manually from GitHub Releases" -ForegroundColor Yellow
        exit 1
    }
    
    # Add to PATH
    Write-Host ""
    Write-Host "Adding to PATH..." -ForegroundColor Green
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$targetDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$targetDir", "User")
        Write-Host "  Added $targetDir to user PATH" -ForegroundColor Green
    } else {
        Write-Host "  Already in PATH" -ForegroundColor Yellow
    }
    
    Show-SuccessMessage $exePath
}

function Install-FromSource {
    Write-Host ""
    Write-Host "Installing from source..." -ForegroundColor Green
    
    # Check Git
    $gitVersion = $null
    try {
        $gitVersion = git --version 2>$null
    } catch {
        $gitVersion = $null
    }
    
    if (-not $gitVersion) {
        Write-Host "  Git is not installed" -ForegroundColor Red
        Write-Host "  Please install Git from https://gitforwindows.org/" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "  Git: $gitVersion" -ForegroundColor Green
    
    # Clone repository
    $cloneDir = "$env:USERPROFILE\NatureCode-Source"
    Write-Host "  Cloning repository to: $cloneDir" -ForegroundColor Gray
    
    if (Test-Path $cloneDir) {
        Write-Host "  Directory exists, pulling latest changes..." -ForegroundColor Yellow
        Set-Location $cloneDir
        git pull origin main
    } else {
        git clone https://github.com/naturecode-official/naturecode.git $cloneDir
        Set-Location $cloneDir
    }
    
    # Install dependencies
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    npm install
    
    # Global install
    Write-Host "  Installing globally..." -ForegroundColor Gray
    npm link
    
    Show-SuccessMessage "naturecode"
}

function Show-SuccessMessage($command) {
    Write-Host ""
    Write-Host "=== Installation Complete ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "NatureCode has been successfully installed!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  $command start      - Start interactive AI session" -ForegroundColor Gray
    Write-Host "  $command model      - Configure AI model settings" -ForegroundColor Gray
    Write-Host "  $command --help     - Show all commands" -ForegroundColor Gray
    Write-Host "  $command --version  - Show version" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "  Config file: $env:USERPROFILE\.naturecode\config.json" -ForegroundColor Gray
    Write-Host "  Plugins dir: $env:USERPROFILE\.naturecode\plugins\" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Run '$command model' to configure your AI provider" -ForegroundColor Gray
    Write-Host "  2. Run '$command start' to begin using NatureCode" -ForegroundColor Gray
    Write-Host "  3. Visit https://github.com/naturecode-official/naturecode for documentation" -ForegroundColor Gray
    Write-Host ""
    
    # Test the installation
    Write-Host "Testing installation..." -ForegroundColor Green
    try {
        & $command --version
        Write-Host "  ✓ Installation verified" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Command found but execution failed" -ForegroundColor Yellow
        Write-Host "  You may need to restart your terminal" -ForegroundColor Gray
    }
}

# Run the installer
try {
    # Main installation logic will run based on user choice
} catch {
    Write-Host "Installation failed: $_" -ForegroundColor Red
    exit 1
}