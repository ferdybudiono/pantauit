$apiKey = "REPLACE_WITH_DEVICE_API_KEY"
$url = "https://your-vercel-app/api/v1/telemetry"

while ($true) {
    $cpu = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
    $disk = (Get-PSDrive C).Used / (Get-PSDrive C).Used / (Get-PSDrive C).Free * 100
    $ssd = 100 # placeholder, use vendor tool for real SSD health

    $body = @{
        cpu_usage = [math]::Round($cpu, 2)
        disk_usage = [math]::Round($disk, 2)
        ssd_health = $ssd
    } | ConvertTo-Json

    Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -Headers @{ "x-api-key" = $apiKey }
    Start-Sleep -Seconds 60
}
