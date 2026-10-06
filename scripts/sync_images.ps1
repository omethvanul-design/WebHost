# ==============================================================================
# Ruksewana Furniture - Automated Image & Gallery Synchronizer
# Scans all images/ subdirectories and updates the corresponding category HTML pages
# ==============================================================================

[CmdletBinding()]
param (
    [string]$SpecificCategory = ""
)

$ErrorActionPreference = "Stop"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

# Base root directory of the website
$rootDir = (Resolve-Path "$PSScriptRoot\..").Path
$imagesDir = Join-Path $rootDir "images"
$pagesDir = Join-Path $rootDir "pages"

Write-Host "=================================================" -ForegroundColor Green
Write-Host "  Ruksewana Furniture - Synchronizing Images...  " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "Root Directory: $rootDir" -ForegroundColor DarkGray

# Define mapping between image folder, HTML page(s), and category labels
$categories = @(
    @{
        Folder = "Dressing"
        Pages = @("pages\dressing-tables.html")
        ItemName = "Dressing Table"
    },
    @{
        Folder = "Tables&chairs"
        Pages = @("pages\tables-chairs.html")
        ItemName = "Table & Chair"
    },
    @{
        Folder = "dining"
        Pages = @("pages\dining-sets.html")
        ItemName = "Dining Set"
    },
    @{
        Folder = "book"
        Pages = @("pages\book-racks-wallshelves.html")
        ItemName = "Book Rack & Wall Shelf"
    },
    @{
        Folder = "raillings"
        Pages = @("pages\stair-cases-railings.html")
        ItemName = "Staircase & Railing"
    },
    @{
        Folder = "Pantry"
        Pages = @("pages\pantry-cupboards.html")
        ItemName = "Pantry Cupboard"
    },
    @{
        Folder = "door"
        Pages = @("pages\doors-windows.html")
        ItemName = "Door & Window"
    },
    @{
        Folder = "bed"
        Pages = @("pages\bedding-solutions.html")
        ItemName = "Bedding Solution"
    },
    @{
        Folder = "tvandother"
        Pages = @("pages\tv-stands-other.html")
        ItemName = "TV Stand & Cupboard"
    },
    @{
        Folder = "other"
        Pages = @("pages\other.html", "pages\Other Handcrafted Furniture & Accessories.html")
        ItemName = "Other Furniture"
    }
)

$supportedExts = @('.jpg', '.jpeg', '.png', '.webp', '.avif')
$totalImagesFound = 0
$galleryManifest = @{}

foreach ($cat in $categories) {
    $folderName = $cat.Folder
    
    # If specific category passed, skip others
    if ($SpecificCategory -and ($folderName -ne $SpecificCategory)) {
        continue
    }

    $catPath = Join-Path $imagesDir $folderName
    if (-not (Test-Path $catPath)) {
        Write-Warning "Directory not found: $catPath"
        continue
    }

    # Fetch and filter images
    $allFiles = Get-ChildItem -Path $catPath -File | Where-Object {
        $supportedExts -contains $_.Extension.ToLower()
    } | Sort-Object Name

    $imageCount = $allFiles.Count
    $totalImagesFound += $imageCount
    $galleryManifest[$folderName] = @()

    # Generate HTML cards
    $cards = [System.Collections.Generic.List[string]]::new()
    $idx = 1
    foreach ($file in $allFiles) {
        $fileName = $file.Name
        $relPath = "../images/$folderName/$fileName"
        $galleryManifest[$folderName] += $relPath

        $designTitle = "$($cat.ItemName) Design $idx"
        $inquiryMsg = [System.Uri]::EscapeDataString("Hi, I'm interested in $designTitle (Photo Ref: $fileName). I'm sending the design image with this message for pricing.")
        
        $card = @"
            <!-- Design $idx -->
            <div class="pantry-gallery-card animate-on-scroll" data-animation="slide-up" data-design-title="$designTitle" data-image-name="$fileName" data-image-src="$relPath">
                <div class="pantry-img-wrapper">
                    <img src="$relPath" alt="$designTitle" loading="lazy">
                </div>
                <div class="pantry-card-footer">
                    <a href="https://wa.me/94779275498?text=$inquiryMsg" class="pantry-inquire-btn" target="_blank" data-design-title="$designTitle" data-image-name="$fileName" data-image-src="$relPath">
                        <i class="fa-brands fa-whatsapp"></i> Inquire This Design
                    </a>
                </div>
            </div>
"@
        $cards.Add($card)
        $idx++
    }

    $cardsHtml = if ($cards.Count -gt 0) {
        $cards -join "`n`n"
    } else {
        @"
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-light);">
                <p>New designs are being added soon. Please contact us on WhatsApp for custom inquiries!</p>
            </div>
"@
    }

    # Inject cards into target HTML pages
    foreach ($pageRel in $cat.Pages) {
        $pagePath = Join-Path $rootDir $pageRel
        if (-not (Test-Path $pagePath)) {
            Write-Warning "Target page not found: $pagePath"
            continue
        }

        $html = [System.IO.File]::ReadAllText($pagePath, [System.Text.Encoding]::UTF8)

        # Regex replace inside <div class="pantry-gallery-grid"> ... </div>
        $pattern = '(?s)(<div\s+class="pantry-gallery-grid"[^>]*>).*?(</div>\s*</main>)'
        if ($html -match $pattern) {
            $replacement = "`$1`n`n$cardsHtml`n`n        `$2"
            $newHtml = [System.Text.RegularExpressions.Regex]::Replace($html, $pattern, $replacement)
            [System.IO.File]::WriteAllText($pagePath, $newHtml, $utf8NoBom)
            Write-Host "  [OK] Updated $pageRel with $imageCount image(s)" -ForegroundColor Cyan
        } else {
            Write-Warning "Could not find pantry-gallery-grid in $pageRel"
        }
    }
}

# Write js/gallery-data.js for dynamic client scripts or manifests
$jsDataPath = Join-Path $rootDir "js\gallery-data.js"
$jsonManifest = ($galleryManifest | ConvertTo-Json -Depth 5)
$jsContent = "// Auto-generated gallery manifest by sync_images.ps1`nwindow.RUKSEWANA_GALLERY_DATA = $jsonManifest;`n"
[System.IO.File]::WriteAllText($jsDataPath, $jsContent, $utf8NoBom)

Write-Host "-------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Sync Complete! Total images processed: $totalImagesFound" -ForegroundColor Green
Write-Host "-------------------------------------------------" -ForegroundColor DarkGray
