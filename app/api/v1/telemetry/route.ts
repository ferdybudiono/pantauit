import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 401 })
  }

  const supabase = createClient()

  // Validate device by api_key
  const { data: device, error: devErr } = await supabase
    .from('devices')
    .select('id, organization_id')
    .eq('api_key', apiKey)
    .single()

  if (devErr || !device) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 })
  }

  const payload = await request.json()
  const { cpu_usage, disk_usage, ssd_health } = payload

  const { error: insertErr } = await supabase.from('telemetry_logs').insert({
    device_id: device.id,
    organization_id: device.organization_id,
    cpu_usage,
    disk_usage,
    ssd_health,
    logged_at: new Date().toISOString(),
  })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Simple alert rule example
  if (disk_usage > 90 || ssd_health < 20) {
    await supabase.from('alerts').insert({
      organization_id: device.organization_id,
      device_id: device.id,
      severity: disk_usage > 95 || ssd_health < 10 ? 'critical' : 'high',
      message: `Disk ${disk_usage}% / SSD health ${ssd_health}%`,
    })
  }

  return NextResponse.json({ ok: true })
}
