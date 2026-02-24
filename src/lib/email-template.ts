interface DigestTopic {
  name: string;
  news_summary: string | null;
  individual_summary: string | null;
  summary: string | null;
  news_takeaways: string[] | null;
  individual_takeaways: string[] | null;
  key_takeaways: string[] | null;
}

interface DigestPost {
  title: string;
  url: string;
  ai_summary: string;
  source: string;
  author: string;
  relevance_score: number;
  section: string | null;
}

interface TopicDigest {
  topic: DigestTopic;
  posts: DigestPost[];
}

export function renderDigestEmail(
  date: string,
  topicDigests: TopicDigest[]
): string {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const topicSections = topicDigests.map((td) => renderTopicSection(td)).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KillDoom Digest — ${formattedDate}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                Kill<span style="color:#ef4444;">Doom</span> Digest
              </h1>
              <p style="margin:8px 0 0;color:#a1a1aa;font-size:14px;">${formattedDate}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;">
              ${topicSections || '<p style="color:#71717a;text-align:center;">No digests available for today.</p>'}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                You received this because you subscribed to KillDoom email digests.
                <br>To unsubscribe, visit the Email Digest page and deactivate your subscription.
              </p>
              <p style="margin:8px 0 0;color:#d4d4d8;font-size:11px;">
                KillDoom — Kill your doomscrolling.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderTopicSection(td: TopicDigest): string {
  const { topic, posts } = td;
  const hasSplit = !!topic.news_summary;

  // Pick summary + takeaways
  const summary = hasSplit
    ? [topic.news_summary, topic.individual_summary].filter(Boolean).join('<br><br>')
    : topic.summary || '';

  const takeaways = hasSplit
    ? [...(topic.news_takeaways || []), ...(topic.individual_takeaways || [])]
    : topic.key_takeaways || [];

  // Top 5 posts by relevance
  const topPosts = [...posts]
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);

  const takeawaysHtml = takeaways.length > 0
    ? `<ul style="margin:12px 0;padding-left:20px;color:#3f3f46;">
        ${takeaways.map((t) => `<li style="margin-bottom:6px;font-size:14px;line-height:1.5;">${escapeHtml(t)}</li>`).join('')}
      </ul>`
    : '';

  const postsHtml = topPosts.length > 0
    ? topPosts.map((p) => renderPostCard(p)).join('')
    : '';

  return `
    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#18181b;border-bottom:2px solid #ef4444;padding-bottom:8px;">
        ${escapeHtml(topic.name)}
      </h2>
      ${summary ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#52525b;">${escapeHtml(summary)}</p>` : ''}
      ${takeawaysHtml}
      ${postsHtml}
    </div>`;
}

function renderPostCard(post: DigestPost): string {
  const sourceLabel = post.source === 'reddit'
    ? 'Reddit'
    : post.source === 'hackernews'
      ? 'HN'
      : post.source === 'twitter'
        ? 'X/Twitter'
        : 'RSS';

  const relevanceColor = post.relevance_score >= 0.8
    ? '#22c55e'
    : post.relevance_score >= 0.6
      ? '#eab308'
      : '#a1a1aa';

  return `
    <div style="margin:12px 0;padding:12px 16px;border:1px solid #e4e4e7;border-radius:8px;background-color:#fafafa;">
      <div style="margin-bottom:6px;">
        <a href="${escapeHtml(post.url)}" style="color:#18181b;font-size:14px;font-weight:600;text-decoration:none;line-height:1.4;">
          ${escapeHtml(post.title)}
        </a>
      </div>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#52525b;">
        ${escapeHtml(post.ai_summary)}
      </p>
      <div style="font-size:11px;color:#a1a1aa;">
        <span style="display:inline-block;padding:2px 6px;background-color:#27272a;color:#ffffff;border-radius:4px;font-size:10px;margin-right:8px;">${sourceLabel}</span>
        ${post.author ? `<span>${escapeHtml(post.author)}</span> &middot; ` : ''}
        <span style="color:${relevanceColor};font-weight:600;">${Math.round(post.relevance_score * 100)}%</span>
      </div>
    </div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
