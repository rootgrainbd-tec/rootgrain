import { RouteRegistry } from '../../../lib/api/registry/route.registry';

const inventoryRoutes = new RouteRegistry();
inventoryRoutes.register({ method: 'GET', path: '/api/v1/inventory', handler: 'InventoryController.list' });
inventoryRoutes.register({ method: 'POST', path: '/api/v1/inventory/adjust', handler: 'InventoryController.adjust' });

export async function GET() { return new Response("OK", { status: 200 }); }
export async function POST() { return new Response("OK", { status: 200 }); }
