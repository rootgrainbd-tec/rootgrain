import { RouteRegistry } from '../../../lib/api/registry/route.registry';

export const reportingRoutes = new RouteRegistry();
reportingRoutes.register({ method: 'GET', path: '/api/v1/reports', handler: 'ReportingController.list' });
reportingRoutes.register({ method: 'POST', path: '/api/v1/reports/generate', handler: 'ReportingController.generate' });

export async function GET() { return new Response(OK, { status: 200 }); }
export async function POST() { return new Response(OK, { status: 200 }); }
