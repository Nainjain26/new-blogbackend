export async function fetchBlogBySlug(slug: string) {
  try {
    const response = await fetch(`/api/blog/${slug}`);
    if (!response.ok) {
      throw new Error("Failed to fetch blog post");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching blog post:", error);
    throw error;
  }
}

export async function fetchAllBlogs() {
  try {
    const response = await fetch("/api/blog");
    if (!response.ok) {
      throw new Error("Failed to fetch blogs");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw error;
  }
}

export async function fetchBlogsByCategory(
  categorySlug: string,
  page = 1,
  limit = 10
) {
  try {
    const response = await fetch(
      `/api/blog/category/${categorySlug}?page=${page}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch blogs by category");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching blogs by category:", error);
    throw error;
  }
}
