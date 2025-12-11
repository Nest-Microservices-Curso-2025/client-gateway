import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const rpcError = exception.getError();

    const errorMessage =
      typeof rpcError === 'string'
        ? rpcError
        : typeof rpcError === 'object' &&
            rpcError !== null &&
            'message' in rpcError
          ? String(rpcError.message)
          : '';

    if (errorMessage.includes('Empty response')) {
      return response.status(500).json({
        status: 500,
        message: errorMessage.substring(
          0,
          errorMessage.indexOf('(') > 0
            ? errorMessage.indexOf('(') - 1
            : errorMessage.length,
        ),
      });
    }

    if (
      typeof rpcError === 'object' &&
      'status' in rpcError &&
      'message' in rpcError
    ) {
      const status: number = rpcError.status as number;
      return response.status(status).json(rpcError);
    }

    response.status(400).json({
      status: 400,
      message: rpcError,
    });
  }
}
