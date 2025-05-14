export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  featured: boolean;
  views: number;
  likes: number;
  comments: Comment[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  post: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
}

export interface BlogPostInput {
  title: string;
  content: string;
  summary: string;
  coverImage: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  featured?: boolean;
}

export interface BlogPostUpdateInput extends Partial<BlogPostInput> {
  _id: string;
}

export interface BlogPostFilters {
  category?: string;
  tag?: string;
  author?: string;
  status?: "draft" | "published" | "archived";
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}
