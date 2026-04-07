export const dynamic = 'force-dynamic'

ï»¿import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('cliniq_events')
      .select('*')
      .limit(5)

    return NextResponse.json({
      ok: !error,
      data,
      error: error ? error.message : null,
    })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      data: null,
      error: e.message || 'unknown error',
    })
  }
}
