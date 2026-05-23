import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidation-secret')
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Revalidate the homepage and collection pages
  revalidatePath('/')
  revalidatePath('/collection')
  
  return NextResponse.json({ revalidated: true })
}
