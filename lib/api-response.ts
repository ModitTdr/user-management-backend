import { NextResponse } from "next/server";

type ApiResponseProps<T> = {
  success: boolean;
  status: number;
  message: string
  data?: T | null;
  errors?: string[];
};


const ApiResponse = <T>({
  success,
  status,
  message = "",
  data = null,
  errors = []
}: ApiResponseProps<T>) => {
  return NextResponse.json(
    {
      success,
      status,
      message,
      data,
      errors,
    },
    { status }
  )
}

export const ok = <T>(message: string, data?: T) => {
  return ApiResponse<T>({
    success: true,
    status: 200,
    message,
    data,
  });
};
export const created = <T>(message: string, data?: T,) => {
  return ApiResponse<T>({
    success: true,
    status: 201,
    message,
    data
  })
}
export const badRequest = (message: string, errors?: string[]) => {
  return ApiResponse({
    success: false,
    status: 400,
    message,
    errors,
  });
};
export const unauthorized = (message: string) => {
  return ApiResponse({
    success: false,
    status: 401,
    message,
  });
};
export const notFound = (message = "Resource not found") => {
  return ApiResponse({
    success: false,
    status: 404,
    message,
  });
};
export const conflict = (message: string) => {
  return ApiResponse({
    success: false,
    status: 409,
    message,
  });
};
export const server = (message: string) => {
  return ApiResponse({
    success: false,
    status: 500,
    message,
  });
};

