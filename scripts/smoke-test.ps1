$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'
$today = (Get-Date -Format 'yyyy-MM-dd')

function Show($label, $value) {
  Write-Host "`n--- $label ---" -ForegroundColor Cyan
  if ($value -is [string]) { Write-Host $value } else { $value | ConvertTo-Json -Compress -Depth 6 | Write-Host }
}

Show '0. /health' (Invoke-WebRequest "$base/health" -UseBasicParsing).Content

Show '1. Register AC-001' (Invoke-RestMethod -Method POST "$base/aircraft" -ContentType 'application/json' `
  -Body (@{ aircraftId='AC-001'; name='Boeing 737'; maintenanceDate=$today; engineerName='Alice' } | ConvertTo-Json))
Show '1. Register AC-002' (Invoke-RestMethod -Method POST "$base/aircraft" -ContentType 'application/json' `
  -Body (@{ aircraftId='AC-002'; name='Airbus A320'; maintenanceDate=$today; engineerName='Bob' } | ConvertTo-Json))

try {
  Invoke-RestMethod -Method POST "$base/aircraft" -ContentType 'application/json' `
    -Body (@{ aircraftId='AC-001'; name='dup'; maintenanceDate=$today; engineerName='X' } | ConvertTo-Json) | Out-Null
} catch { Show '1b. Duplicate (expect 409)' $_.ErrorDetails.Message }

Show '2. AC-001 -> IN_PROGRESS' (Invoke-RestMethod -Method PATCH "$base/aircraft/AC-001/status" -ContentType 'application/json' `
  -Body (@{ status='IN_PROGRESS' } | ConvertTo-Json))

try {
  Invoke-RestMethod -Method PATCH "$base/aircraft/AC-002/status" -ContentType 'application/json' `
    -Body (@{ status='COMPLETED' } | ConvertTo-Json) | Out-Null
} catch { Show '2b. Invalid transition (expect 400)' $_.ErrorDetails.Message }

Show '3. in-progress'      (Invoke-RestMethod "$base/aircraft/in-progress")
Show '3. scheduled-today'  (Invoke-RestMethod "$base/aircraft/scheduled-today")

Invoke-RestMethod -Method PATCH "$base/aircraft/AC-001/status" -ContentType 'application/json' `
  -Body (@{ status='COMPLETED' } | ConvertTo-Json) | Out-Null
Show '5. AC-001 history' (Invoke-RestMethod "$base/aircraft/AC-001").history
Show '5. summary' (Invoke-RestMethod "$base/aircraft/summary")
