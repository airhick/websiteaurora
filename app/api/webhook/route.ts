import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Proxy the request to the n8n webhook
    const response = await fetch('https://n8n.goreview.fr/webhook-test/623986cb-0aac-4af5-8135-d6da55814b95', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error in webhook proxy:', error)
    return NextResponse.json(
      { error: 'Failed to proxy webhook request', message: error.message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

