import { RouteRegistry } from '../../../lib/api/registry/route.registry';

export const orderRoutes = new RouteRegistry();
orderRoutes.register({ method: 'GET', path: '/api/v1/orders', handler: 'OrderController.list' });
orderRoutes.register({ method: 'POST', path: '/api/v1/orders', handler: 'OrderController.create' });

export async function GET() { return new Response(OK, { status: 200 }); }
export async function POST() { return new Response(OK, { status: 200 }); }
