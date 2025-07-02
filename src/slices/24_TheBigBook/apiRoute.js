import { getLedger } from '../../../slices/24_TheBigBook/BigBookSubscriber.js';

export async function GET() {
  // Next.js API route (App Router)
  return new Response(JSON.stringify(getLedger()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}