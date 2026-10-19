# Generates the PWA install icons (192px + 512px, and a maskable 512px).
# Run: powershell -ExecutionPolicy Bypass -File tools\make-pwa-icons.ps1
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path (Split-Path -Parent $PSScriptRoot) "icons"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

function New-RoundRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddLine($x + $r, $y, $x + $w - $r, $y)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddLine($x + $w, $y + $r, $x + $w, $y + $h - $r)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddLine($x + $w - $r, $y + $h, $x + $r, $y + $h)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.AddLine($x, $y + $h - $r, $x, $y + $r)
    $p.CloseFigure()
    return $p
}

function New-Icon([int]$s, [string]$name, [float]$safeFrac) {
    $file = Join-Path $outDir $name
    $bmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # maskable icons keep the logo inside a central safe zone (~80%)
    $pad = [float]($s * $safeFrac)
    $side = [float]($s - 2 * $pad)
    $rect = New-Object System.Drawing.RectangleF($pad, $pad, $side, $side)
    $c1 = [System.Drawing.Color]::FromArgb(255, 109, 94, 252)
    $c2 = [System.Drawing.Color]::FromArgb(255, 168, 85, 247)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45)
    $rr = New-RoundRectPath $pad $pad $side $side ([float]($s * 0.25))
    $g.FillPath($brush, $rr)

    $bolt = @(@(18.4, 7.5), @(10.0, 17.6), @(14.6, 17.6), @(13.4, 24.5), @(21.8, 14.4), @(17.1, 14.4))
    $k = $side / 32.0   # scale the bolt to the drawn square, not the full canvas
    $pts = New-Object 'System.Drawing.PointF[]' $bolt.Count
    for ($i = 0; $i -lt $bolt.Count; $i++) {
        $pts[$i] = New-Object System.Drawing.PointF(($pad + $bolt[$i][0] * $k), ($pad + $bolt[$i][1] * $k))
    }
    $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $g.FillPolygon($white, $pts)

    $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
    $white.Dispose(); $brush.Dispose(); $rr.Dispose(); $g.Dispose(); $bmp.Dispose()
    Write-Output ("wrote " + $file)
}

# "any" icon — full-bleed rounded square
New-Icon 192 "icon192.png" 0.04
New-Icon 512 "icon512.png" 0.04
# "maskable" — logo inset so Android's circular/square mask never clips it
New-Icon 512 "icon-maskable-512.png" 0.12
