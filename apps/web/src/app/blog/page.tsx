import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BlogHero } from "./_components/blog-hero";
import { CategoryFilter } from "./_components/category-filter";
import { PostGrid } from "./_components/post-grid";

export const metadata: Metadata = {
  title: "블로그 — semo",
  description:
    "semo 팀의 이야기, 업데이트, 그리고 음성 메모 활용 팁을 공유해요.",
};

export default function BlogPage() {
  return (
    <div className="min-h-svh">
      <Header />
      <BlogHero />
      <CategoryFilter />
      <PostGrid />
      <Footer />
    </div>
  );
}
