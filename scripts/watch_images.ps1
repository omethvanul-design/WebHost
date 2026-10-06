# ==============================================================================
# Ruksewana Furniture - Real-Time Image Folder Watcher
# Automatically watches images/ folder and triggers sync_images.ps1 on changes
# ==============================================================================

$ErrorActionPreference = "Stop"

$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
$imagesDir = Join-Path $rootDir "images"
$syncScript = Join-Path $PSScriptRoot "sync_images.ps1"

Write-Host "=================================================" -ForegroundColor Green
Write-Host "  Ruksewana Furniture - Live Folder Watcher      " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "Watching Directory: $imagesDir" -ForegroundColor Cyan
Write-Host "Any image added, renamed or deleted in any category" -ForegroundColor Yellow
Write-Host "folder will automatically update the website!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop watching." -ForegroundColor DarkGray
Write-Host "-------------------------------------------------" -ForegroundColor DarkGray

# Run an initial synchronization
powershell -ExecutionPolicy Bypass -File $syncScript

# Create FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $imagesDir
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite'

$supportedExts = @('.jpg', '.jpeg', '.png', '.webp', '.avif')
$global:lastSyncTime = [DateTime]::MinValue
$global:debounceLock = $false

$action = {
    param($source, $eventArgs)
    $ext = [System.IO.Path]::GetExtension($eventArgs.FullPath).ToLower()
    if ($supportedExts -notcontains $ext) {
        return
    }

    $now = [DateTime]::Now
    # Debounce 1000ms to allow file writes to finish completely
    if (($now - $global:lastSyncTime).TotalMilliseconds -lt 1000) {
        return
    }
    $global:lastSyncTime = $now

    $changeType = $eventArgs.ChangeType
    $fileName = $eventArgs.Name
    Write-Host "[Watcher] Detected $changeType in images: $fileName" -ForegroundColor Magenta
    
    # Slight sleep to release file handle from copy process
    Start-Sleep -Milliseconds 600

    try {
        powershell -ExecutionPolicy Bypass -File $syncScript
        Write-Host "[Watcher] Successfully updated website at $(Get-Date -Format 'HH:mm:ss')!" -ForegroundColor Green
    } catch {
        Write-Warning "Sync error: $_"
    }
}

# Register events
$handlers = @()
$handlers += Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action
$handlers += Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
$handlers += Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action
$handlers += Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping image watcher..." -ForegroundColor Yellow
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    foreach ($h in $handlers) {
        Unregister-Event -SourceIdentifier $h.Name -ErrorAction SilentlyContinue
    }
}
