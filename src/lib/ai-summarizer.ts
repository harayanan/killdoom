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

export interface SplitDigestResult {
  news_summary: string;
  news_takeaways: string[];
  news_post_summaries: PostSummary[];
  individual_summary: string;
  individual_takeaways: string[];
  individual_post_summaries: PostSummary[];
}

export interface SourceFeedbackEntry {
  source_identifier: string;
  feedback: 'like' | 'dislike';
}

function formatPostsText(posts: FetchedPost[]): string {
  return posts
    .map(
      (p, i) =>
        `${i + 1}. [${p.source}${p.subreddit ? ` r/${p.subreddit}` : ''}] ${p.title}${p.score > 0 ? ` (score: ${p.score})` : ''}\n   ${p.body?.slice(0, 500) || 'No body text'}`
    )
    .join('\n\n');
}

function formatFeedbackContext(feedback: SourceFeedbackEntry[]): string {
  if (feedback.length === 0) return '';

  const liked = feedback.filter((f) => f.feedback === 'like').map((f) => f.source_identifier);
  const disliked = feedback.filter((f) => f.feedback === 'dislike').map((f) => f.source_identifier);

  let context = '\n\nSOURCE PREFERENCES (from user feedback):';
  if (liked.length > 0) {
    context += `\n- Preferred sources (boost relevance by +0.1): ${liked.join(', ')}`;
  }
  if (disliked.length > 0) {
    context += `\n- Deprioritized sources (reduce relevance by -0.15): ${disliked.join(', ')}`;
  }
  return context;
}

/**
 * Original single-section digest — kept for backward compatibility.
 */
export async function generateDigest(
  topicName: string,
  posts: FetchedPost[]
): Promise<DigestResult> {
  const postsText = formatPostsText(posts);

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

/**
 * Dual-section digest: separate summaries for news and individual posts.
 * Incorporates source feedback to adjust relevance scoring.
 */
export async function generateSplitDigest(
  topicName: string,
  newsPosts: FetchedPost[],
  individualPosts: FetchedPost[],
  feedback: SourceFeedbackEntry[] = []
): Promise<SplitDigestResult> {
  const newsText = formatPostsText(newsPosts);
  const individualText = formatPostsText(individualPosts);
  const feedbackContext = formatFeedbackContext(feedback);

  const prompt = `You are a strict content curator for the topic "${topicName}". Analyze TWO sets of posts and create a dual-section daily digest.

=== NEWS POSTS (from outlets like BBC, Bloomberg, HN, The Verge, etc.) ===
${newsText || '(No news posts today)'}

=== INDIVIDUAL POSTS (from Reddit communities, Substack creators, personal blogs, dev.to) ===
${individualText || '(No individual posts today)'}
${feedbackContext}

Create a dual-section digest with STRICT relevance scoring. Respond in valid JSON:
{
  "news_summary": "2-3 sentence overview of today's news stories for this topic",
  "news_takeaways": ["3-5 key insights from news sources"],
  "news_post_summaries": [{"post_index": 1, "summary": "...", "relevance_score": 0.85}],
  "individual_summary": "2-3 sentence overview of community/creator content",
  "individual_takeaways": ["3-5 key insights from individual sources"],
  "individual_post_summaries": [{"post_index": 1, "summary": "...", "relevance_score": 0.85}]
}

STRICT SCORING RULES:
- 0.8-1.0: Must-read. Genuinely important, surprising, or highly actionable.
- 0.6-0.79: Worth reading. Solid content with clear value.
- 0.4-0.59: Marginal. Somewhat interesting but not essential.
- 0.0-0.39: Noise. Low quality, repetitive, clickbait, or off-topic. Be aggressive about scoring content here.
- If source preferences are listed above, apply the stated boosts/penalties to your scores.
- Default to skepticism: if a post doesn't clearly add value, score it below 0.5.

Guidelines:
- Be concise and value-driven — this replaces doomscrolling so every word should count
- Focus on signal over noise
- Highlight surprising or counterintuitive insights
- If posts are low quality or repetitive, say so honestly
- Write in a direct, slightly informal tone
- If one section has no posts, still include empty arrays for it`;

  const text = await generateWithRetry(prompt);
  return extractJson<SplitDigestResult>(text);
}
