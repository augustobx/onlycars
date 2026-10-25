Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\public\icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null
}

function Create-PwaIcon {
    param(
        [string]$Filename,
        [int]$Size,
        [string]$BgColorHex,
        [string]$AccentColorHex,
        [string]$BadgeText,
        [string]$Label
    )

    $outPath = Join-Path $iconsDir $Filename
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $bgColor = [System.Drawing.ColorTranslator]::FromHtml($BgColorHex)
    $accentColor = [System.Drawing.ColorTranslator]::FromHtml($AccentColorHex)

    # Background
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bgColor, [System.Drawing.Color]::FromArgb(255, [Math]::Max(0, $bgColor.R - 15), [Math]::Max(0, $bgColor.G - 15), [Math]::Max(0, $bgColor.B - 15)), 45)
    $g.FillRectangle($bgBrush, $rect)

    # Border ring
    $pen = New-Object System.Drawing.Pen($accentColor, [float]($Size * 0.03))
    $innerOffset = [int]($Size * 0.06)
    $innerSize = $Size - ($innerOffset * 2)
    $g.DrawEllipse($pen, $innerOffset, $innerOffset, $innerSize, $innerSize)

    # Central circle emblem
    $emblemOffset = [int]($Size * 0.22)
    $emblemSize = $Size - ($emblemOffset * 2)
    $emblemRect = New-Object System.Drawing.Rectangle($emblemOffset, $emblemOffset, $emblemSize, $emblemSize)
    $emblemBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($emblemRect, $accentColor, [System.Drawing.Color]::FromArgb(255, [Math]::Min(255, $accentColor.R + 40), [Math]::Min(255, $accentColor.G + 40), [Math]::Min(255, $accentColor.B + 40)), 90)
    $g.FillEllipse($emblemBrush, $emblemRect)

    # Center Badge Letter
    $fontEmblem = New-Object System.Drawing.Font('Arial', [float]($Size * 0.28), [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($BadgeText, $fontEmblem, $whiteBrush, ($Size / 2), ($Size * 0.46), $sf)

    # Bottom Label
    $fontSub = New-Object System.Drawing.Font('Arial', [float]($Size * 0.075), [System.Drawing.FontStyle]::Bold)
    $g.DrawString($Label.ToUpper(), $fontSub, $whiteBrush, ($Size / 2), ($Size * 0.82), $sf)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $Filename"
}

# 1. Admin icons (Emerald / Slate)
Create-PwaIcon -Filename "admin-192.png" -Size 192 -BgColorHex "#0b0f19" -AccentColorHex "#10b981" -BadgeText "A" -Label "Admin"
Create-PwaIcon -Filename "admin-512.png" -Size 512 -BgColorHex "#0b0f19" -AccentColorHex "#10b981" -BadgeText "A" -Label "Admin"

# 2. Seller icons (Sunset Orange / Slate)
Create-PwaIcon -Filename "seller-192.png" -Size 192 -BgColorHex "#0f172a" -AccentColorHex "#ea580c" -BadgeText "V" -Label "Ventas"
Create-PwaIcon -Filename "seller-512.png" -Size 512 -BgColorHex "#0f172a" -AccentColorHex "#ea580c" -BadgeText "V" -Label "Ventas"

# 3. Client icons (Cyan / Emerald / Dark)
Create-PwaIcon -Filename "client-192.png" -Size 192 -BgColorHex "#090d16" -AccentColorHex "#0284c7" -BadgeText "C" -Label "Clientes"
Create-PwaIcon -Filename "client-512.png" -Size 512 -BgColorHex "#090d16" -AccentColorHex "#0284c7" -BadgeText "C" -Label "Clientes"

# Root fallbacks
$publicDir = Join-Path $PSScriptRoot "..\public"
Copy-Item (Join-Path $iconsDir "admin-192.png") (Join-Path $publicDir "icon-192x192.png") -Force
Copy-Item (Join-Path $iconsDir "admin-512.png") (Join-Path $publicDir "icon-512x512.png") -Force
Copy-Item (Join-Path $iconsDir "admin-192.png") (Join-Path $publicDir "apple-touch-icon.png") -Force

Write-Host "All PWA icons generated successfully!"
