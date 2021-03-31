import { httpResponse } from '../model/model';

export function createSuccessResponse(data: any): httpResponse {
  return {
    status: true,
    data: data,
  };
}

export function createErrorResponse(data: any): httpResponse {
  return {
    status: false,
    data: data,
  };
}

const convert = (from?, to?) => (str) => Buffer.from(str, from).toString(to);
export const utf8ToHex = convert('utf8', 'hex');
export const hexToUtf8 = convert('hex', 'utf8');
export const btoa = convert(undefined, 'base64');
export const atob = convert('base64');
