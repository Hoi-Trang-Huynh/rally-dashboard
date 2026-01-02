import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number = 500, error?: any) {
  if (error) {
    console.error(`[API Error] ${message}:`, error);
  }
  return NextResponse.json({ error: message }, { status });
}
