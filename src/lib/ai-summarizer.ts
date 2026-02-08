import { generateWithRetry, extractJson } from './gemini';
import type { FetchedPost } from './content-fetcher';

export interface PostSummary {
  post_index: number;
  summary: string;
  relevance_score: number;
}

export interface DigestResult {
  overall_summary: string;
  key_takeaways: string[];
  post_summaries: PostSummary[];
}

export async function generateDigest(
  topicName: string,
  posts: FetchedPost[]
): Promise<DigestResult> {
  const postsText = posts
    .map(
      (p, i) =>
        `${i + 1}. [${p.source}${p.subreddit ? ` r/${p.subreddit}` : ''}] ${p.title}${p.score > 0 ? ` (score: ${p.score})` : ''}\n   ${p.body?.slice(0, 500) || 'No body text'}`
    )
    .join('\n\n');

  const prompt = `You are a content curator for the topic "${topicName}". Analyze the following posts and create a comprehensive daily digest.

POSTS:
${postsText}

Create a digest with:
1. "overall_summary": A 3-4 sentence overview of today's top content for this topic. What are the big themes and stories?
2. "key_takeaways": An array of 3-5 concise bullet points capturing the most important insights. Each should be actionable or genuinely informative.
3. "post_summaries": An array of objects for each post:
   - "post_index": The 1-based index of the post
   - "summary": A 1-2 sentence summary of the post's key point
   - "relevance_score": A score from 0.0 to 1.0 indicating how relevant/valuable this post is (1.0 = must read, 0.0 = noise)

Guidelines:
- Be concise and value-driven — this replaces doomscrolling so every word should count
- Focus on signal over noise
- Highlight surprising or counterintuitive insights
- If posts are low quality or repetitive, say so honestly
- Write in a direct, slightly informal tone

Respond in valid JSON format:
{
  "overall_summary": "...",
  "key_takeaways": ["...", "..."],
  "post_summaries": [{"post_index": 1, "summary": "...", "relevance_score": 0.85}]
}`;

  const text = await generateWithRetry(prompt);
  return extractJson<DigestResult>(text);
}
