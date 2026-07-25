import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { adminBlogService } from "@/services/admin/blog.service";
import { ApiError } from "@/middleware/errorHandler";

const mockPrisma = prisma as unknown as {
  blogPost: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe("adminBlogService.create", () => {
  it("rejects a duplicate slug", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValueOnce({ id: "existing" });

    await expect(
      adminBlogService.create("author_1", {
        title: "Test",
        slug: "test",
        contentHtml: "<p>Body</p>",
        status: "DRAFT",
      }),
    ).rejects.toThrow(ApiError);
  });

  it("sanitizes contentHtml before persisting", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValueOnce(null);
    mockPrisma.blogPost.create.mockResolvedValueOnce({ id: "post_1" });

    await adminBlogService.create("author_1", {
      title: "Test",
      slug: "test",
      contentHtml: '<p>Hi</p><script>alert(1)</script>',
      status: "DRAFT",
    });

    const createCall = mockPrisma.blogPost.create.mock.calls[0][0];
    expect(createCall.data.contentHtml).not.toContain("<script>");
    expect(createCall.data.contentHtml).toContain("<p>Hi</p>");
  });

  it("sets publishedAt when created directly as PUBLISHED", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValueOnce(null);
    mockPrisma.blogPost.create.mockResolvedValueOnce({ id: "post_1" });

    await adminBlogService.create("author_1", {
      title: "Test",
      slug: "test",
      contentHtml: "<p>Hi</p>",
      status: "PUBLISHED",
    });

    const createCall = mockPrisma.blogPost.create.mock.calls[0][0];
    expect(createCall.data.publishedAt).toBeInstanceOf(Date);
  });
});

describe("adminBlogService.update", () => {
  it("sets publishedAt only when transitioning into PUBLISHED", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValueOnce({
      id: "post_1",
      slug: "test",
      status: "DRAFT",
    });
    mockPrisma.blogPost.update.mockResolvedValueOnce({ id: "post_1" });

    await adminBlogService.update("post_1", { status: "PUBLISHED" });

    const updateCall = mockPrisma.blogPost.update.mock.calls[0][0];
    expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
  });

  it("does not touch publishedAt when already published", async () => {
    mockPrisma.blogPost.findUnique.mockResolvedValueOnce({
      id: "post_1",
      slug: "test",
      status: "PUBLISHED",
    });
    mockPrisma.blogPost.update.mockResolvedValueOnce({ id: "post_1" });

    await adminBlogService.update("post_1", { title: "Updated title" });

    const updateCall = mockPrisma.blogPost.update.mock.calls[0][0];
    expect(updateCall.data.publishedAt).toBeUndefined();
  });
});
