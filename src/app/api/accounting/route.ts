import { RouteRegistry } from '../../../lib/api/registry/route.registry';

const accountingRoutes = new RouteRegistry();
accountingRoutes.register({ method: 'GET', path: '/api/v1/accounting/invoices', handler: 'AccountingController.list' });
accountingRoutes.register({ method: 'POST', path: '/api/v1/accounting/invoices', handler: 'AccountingController.generate' });

export async function GET() { return new Response("OK", { status: 200 }); }
export async function POST() { return new Response("OK", { status: 200 }); }
