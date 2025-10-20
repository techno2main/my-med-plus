# Script de migration automatique des noms de colonnes
# Renommage : default_dosage → default_posology, dosage_amount → strength

$files = @(
    "src\pages\Treatments.tsx",
    "src\pages\TreatmentEdit.tsx",
    "src\pages\StockForm.tsx",
    "src\pages\Stock.tsx",
    "src\pages\Index.tsx",
    "src\pages\History.tsx",
    "src\pages\Calendar.tsx",
    "src\components\TreatmentWizard\types.ts",
    "src\components\TreatmentWizard\TreatmentWizard.tsx",
    "src\components\TreatmentWizard\Step2Medications.tsx",
    "src\hooks\useMissedIntakesDetection.tsx"
)

foreach ($file in $files) {
    $filePath = "c:\xampp\htdocs\web-am\dev.tad\MyHealthPlus\$file"
    if (Test-Path $filePath) {
        Write-Host "Traitement de $file..." -ForegroundColor Cyan
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Remplacements pour medication_catalog
        $content = $content -replace 'default_dosage', 'default_posology'
        $content = $content -replace 'dosage_amount', 'strength'
        
        # Sauvegarder
        Set-Content $filePath $content -Encoding UTF8 -NoNewline
        Write-Host "✓ $file mis à jour" -ForegroundColor Green
    } else {
        Write-Host "✗ $file non trouvé" -ForegroundColor Red
    }
}

Write-Host "`n✅ Migration terminée !" -ForegroundColor Green
