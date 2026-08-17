Add-Type -AssemblyName System.Drawing
$S = 1500
$cell = 500
$bmp = New-Object Drawing.Bitmap $S, $S
$g = [Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([Drawing.Color]::FromArgb(255, 18, 28, 40))

$sea = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(255, 32, 58, 82))
$land = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(255, 48, 72, 58))
$land2 = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(255, 58, 82, 64))
$line = New-Object Drawing.Pen ([Drawing.Color]::FromArgb(200, 200, 220, 180), 3)
$font = New-Object Drawing.Font "Segoe UI", 18, ([Drawing.FontStyle]::Bold)
$font2 = New-Object Drawing.Font "Segoe UI", 12
$white = New-Object Drawing.SolidBrush ([Drawing.Color]::White)
$muted = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(220, 180, 200, 170))

$ids = @("i00","i01","i02","i10","i11","i12","i20","i21","i22")
$names = @("SEA NW","NORTH","SEA NE","WEST","CENTER","EAST","SEA SW","PIER","SEA SE")
$kinds = @("sea","land","sea","land","land","land","sea","land","sea")

for ($r = 0; $r -lt 3; $r++) {
  for ($c = 0; $c -lt 3; $c++) {
    $i = $r * 3 + $c
    $x = $c * $cell
    $y = $r * $cell
    if ($kinds[$i] -eq "sea") {
      $g.FillRectangle($sea, $x, $y, $cell, $cell)
    } elseif (($r + $c) % 2 -eq 0) {
      $g.FillRectangle($land, $x, $y, $cell, $cell)
    } else {
      $g.FillRectangle($land2, $x, $y, $cell, $cell)
    }
    $g.DrawRectangle($line, $x + 2, $y + 2, $cell - 4, $cell - 4)
    $g.DrawString(($ids[$i] + " " + $names[$i]), $font, $white, ($x + 16), ($y + 16))
    $g.DrawString("333m x 333m", $font2, $muted, ($x + 16), ($y + 48))
  }
}

$leg = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(210, 10, 12, 16))
$g.FillRectangle($leg, 20, 1420, 980, 60)
$g.DrawString("ISLAND ~1km | 9 sectors | usable land ~700m | person 1m", $font2, $white, 30, 1440)

$vp = New-Object Drawing.Pen ([Drawing.Color]::FromArgb(230, 110, 220, 140), 3)
$vp.DashStyle = [Drawing.Drawing2D.DashStyle]::Dash
$vw = [int](119 * 1.5)
$vh = [int](67 * 1.5)
$g.DrawRectangle($vp, 700, 1350, $vw, $vh)
$g.DrawString("mobile view ~67m", $font2, $white, 700, 1328)

$out = "C:\xoox\data\ui\journey\island_overview_1km.png"
$bmp.Save($out, [Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "OK $out"
