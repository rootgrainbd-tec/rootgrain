import { RouteRegistry } from '../../../lib/api/registry/route.registry';

const resourceRoutes = new RouteRegistry();
resourceRoutes.register({ method: 'GET', path: '/api/v1/resources', handler: 'ResourceController.list' });
resourceRoutes.register({ method: 'GET', path: '/api/v1/resources/:id', handler: 'ResourceController.get' });
resourceRoutes.register({ method: 'POST', path: '/api/v1/resources', handler: 'ResourceController.create' });

export async function GET() { return new Response("OK", { status: 200 }); }
export async function POST() { return new Response("OK", { status: 200 }); }
