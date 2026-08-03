import { RouteRegistry } from '../../../lib/api/registry/route.registry';

export const productionRoutes = new RouteRegistry();
productionRoutes.register({ method: 'GET', path: '/api/v1/production/batches', handler: 'ProductionController.list' });
productionRoutes.register({ method: 'POST', path: '/api/v1/production/start', handler: 'ProductionController.start' });

export async function GET() { return new Response(OK, { status: 200 }); }
export async function POST() { return new Response(OK, { status: 200 }); }
