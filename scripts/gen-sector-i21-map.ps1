Add-Type -AssemblyName System.Drawing
$W = 1280
$H = 3600
$ppm = 30
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(255, 28, 48, 62))

$sky = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
  (New-Object System.Drawing.Point 0, 0),
  (New-Object System.Drawing.Point 0, 900),
  [System.Drawing.Color]::FromArgb(255, 90, 140, 170),
  [System.Drawing.Color]::FromArgb(255, 40, 70, 90)
)
$g.FillRectangle($sky, 0, 0, $W, 900)

$sea = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
  (New-Object System.Drawing.Point 0, 2800),
  (New-Object System.Drawing.Point 0, 3600),
  [System.Drawing.Color]::FromArgb(255, 35, 70, 95),
  [System.Drawing.Color]::FromArgb(255, 20, 45, 70)
)
$g.FillRectangle($sea, 0, 2700, $W, 900)

$landBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 58, 78, 62))
$g.FillRectangle($landBrush, 80, 200, 1120, 2700)

$pierY = 3000
$plank = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 120, 90, 55))
$plankDark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 90, 65, 40))
for ($i = 0; $i -lt 18; $i++) {
  $yy = $pierY + $i * 18
  if ($i % 2 -eq 0) { $g.FillRectangle($plank, 200, $yy, 880, 16) }
  else { $g.FillRectangle($plankDark, 200, $yy, 880, 16) }
}

$road = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 70, 68, 58))
$g.FillRectangle($road, 595, 400, 90, 2600)

$bld = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 95, 85, 70))
$bld2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 110, 75, 60))
$g.FillRectangle($bld, 220, 2500, 150, 150)
$g.FillRectangle($bld2, 780, 2100, 360, 240)
$g.FillRectangle($bld, 250, 1600, 180, 180)
$g.FillRectangle($bld2, 900, 900, 120, 120)

$hill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 40, 70, 45))
$g.FillEllipse($hill, -100, 500, 500, 400)
$g.FillEllipse($hill, 900, 600, 500, 450)

$penGrid = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(50, 255, 255, 255), 1)
$penView = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 110, 220, 140), 3)
$penView.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
for ($m = 0; $m -le 120; $m += 10) {
  $y = [int]($m * $ppm)
  $g.DrawLine($penGrid, 0, $y, $W, $y)
}
for ($m = 0; $m -le 42; $m += 10) {
  $x = [int]($m * $ppm)
  $g.DrawLine($penGrid, $x, 0, $x, $H)
}
for ($v = 0; $v -lt 5; $v++) {
  $y = [int]($v * 24 * $ppm)
  $g.DrawRectangle($penView, 2, $y + 2, $W - 4, [int](24 * $ppm) - 4)
}

$cx = 640
$cy = 3300
$charH = [int](1.2 * $ppm)
$charW = [int]($charH * 0.45)
$charBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230, 255, 180, 90))
$g.FillEllipse($charBrush, [int]($cx - $charW / 2), [int]($cy - $charH), $charW, $charH)

$leg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 15, 18, 24))
$g.FillRectangle($leg, 20, 20, 460, 160)
$font = New-Object System.Drawing.Font "Segoe UI", 16, ([System.Drawing.FontStyle]::Bold)
$font2 = New-Object System.Drawing.Font "Segoe UI", 12
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g.DrawString("SECTOR i21 PIER - SCALE GUIDE", $font, $white, 30, 28)
$g.DrawString("char 1.2m = 36px | view 24m | sector 120m", $font2, $white, 30, 58)
$g.DrawString("art 1280x3600 @ 30px/m | world_h_pct=500", $font2, $white, 30, 82)
$g.DrawString("dashed box = one game screen", $font2, $white, 30, 106)
$g.FillRectangle($charBrush, 30, 140, [int](5 * $ppm), 10)
$g.DrawString("5m bar", $font2, $white, 30 + [int](5 * $ppm) + 8, 136)

$out = Join-Path $PSScriptRoot "..\data\ui\journey\sector_i21_map.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "OK $out"
