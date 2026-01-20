# Encoding UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIX Android Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Chemin vers le fichier build.gradle de capacitor-native-biometric
$buildGradlePath = "node_modules\capacitor-native-biometric\android\build.gradle"

if (Test-Path $buildGradlePath) {
    Write-Host "[INFO] Correction de capacitor-native-biometric..." -ForegroundColor Cyan
    
    # Lire le contenu
    $content = Get-Content $buildGradlePath -Raw
    
    # Remplacer jcenter() par mavenCentral()
    $newContent = $content -replace 'jcenter\(\)', 'mavenCentral()'
    
    # Écrire le nouveau contenu
    Set-Content $buildGradlePath $newContent -Encoding UTF8
    
    Write-Host "[OK] jcenter() remplacé par mavenCentral()" -ForegroundColor Green
} else {
    Write-Host "[WARN] Fichier non trouvé: $buildGradlePath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[OK] Corrections terminées" -ForegroundColor Green
