$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$base = "d:\Informatica\Extensao_Diversos\BW&Ipas_Projetos\IpasExtensao\ExrtensãoPatentesMarca\ExtensaoPatente-Marca\assets\images"
if (-not (Test-Path $base)) { New-Item -ItemType Directory -Force -Path $base | Out-Null }

function Make-Icon {
    param(
        [int]$Size,
        [string]$File
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'

    # Fundo azul
    $g.Clear([System.Drawing.Color]::FromArgb(0,39,118))

    # Losango amarelo
    $m = [Math]::Max(1, [Math]::Floor($Size * 0.1))
    $diamond = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diamond.AddPolygon(@(
        [System.Drawing.Point]::new($Size/2, $m),
        [System.Drawing.Point]::new($Size-$m, $Size/2),
        [System.Drawing.Point]::new($Size/2, $Size-$m),
        [System.Drawing.Point]::new($m, $Size/2)
    ))
    $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,223,0))), $diamond)

    # Retângulo branco central (documento)
    $inner = New-Object System.Drawing.Drawing2D.GraphicsPath
    $inner.AddRectangle([System.Drawing.Rectangle]::new([int]($Size*0.35), [int]($Size*0.3), [int]($Size*0.3), [int]($Size*0.4)))
    $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,255,255))), $inner)

    $bmp.Save($File, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose();
    $bmp.Dispose();

    Write-Host "Saved $File"
}

Make-Icon -Size 16  -File "$base\icon16.png"
Make-Icon -Size 48  -File "$base\icon48.png"
Make-Icon -Size 128 -File "$base\icon128.png"
