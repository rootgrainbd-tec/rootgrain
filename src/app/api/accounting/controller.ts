import { RequestMiddleware } from '../middleware/request.middleware';
import { ResponseMiddleware } from '../middleware/response.middleware';
import { ExceptionMiddleware } from '../middleware/exception.middleware';
import { HTTP_STATUS } from '../../../lib/api/constants/api.constants';

export class AccountingController {
  static async handleRequest(req: any, handlerFn: (validatedReq: any) => Promise<any>) {
    try {
      const parsedReq = RequestMiddleware.process(req);
      const result = await handlerFn(parsedReq);
      return { statusCode: HTTP_STATUS.OK, body: ResponseMiddleware.formatSuccess(result) };
    } catch (e) {
      return ExceptionMiddleware.handle(e);
    }
  }
}
