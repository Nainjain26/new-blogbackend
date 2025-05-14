import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/blog/category/${params.slug}?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch blogs by category");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching blogs by category:", error);
    return NextResponse.json(
      { message: "Error fetching blogs by category" },
      { status: 500 }
    );
  }
}
