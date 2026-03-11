import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content/learn");

export interface TopicMeta {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  order: number;
  readingTime: string;
}

export function getAllTopics(): TopicMeta[] {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  return files
    .map((filename) => {
      const slug = filename.replace(".mdx", "");
      const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
      const { data, content } = matter(raw);
      const wordCount = content.split(/\s+/).length;
      return {
        slug,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        order: data.order,
        readingTime: `${Math.ceil(wordCount / 200)} min read`,
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function getTopicContent(
  slug: string
): { meta: TopicMeta; content: string } | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const wordCount = content.split(/\s+/).length;
  return {
    meta: {
      slug,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      order: data.order,
      readingTime: `${Math.ceil(wordCount / 200)} min read`,
    },
    content,
  };
}
