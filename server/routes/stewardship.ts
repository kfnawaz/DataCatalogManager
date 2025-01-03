import { Router } from "express";
import { db } from "@db";
import { and, desc, eq, sql } from "drizzle-orm";
import { 
  comments,
  commentReactions,
  commentBadges,
  qualityMetrics,
  dataProducts
} from "@db/schema";

const router = Router();

// Calculate user's level based on reputation score
function calculateLevel(reputationScore: number): number {
  return Math.floor(reputationScore / 100) + 1;
}

router.get("/api/stewardship/metrics", async (req, res) => {
  try {
    // Get user's comments and their impact
    const userComments = await db
      .select({
        totalCount: sql<number>`count(*)`.mapWith(Number),
        helpfulCount: sql<number>`
          count(case when exists (
            select 1 from ${commentReactions}
            where ${commentReactions.commentId} = ${comments.id}
            and ${commentReactions.type} = 'helpful'
          ) then 1 end)
        `.mapWith(Number)
      })
      .from(comments)
      .where(eq(comments.authorName, req.user?.username || ""));

    // Get user's badges
    const badges = await db
      .select({
        type: commentBadges.type,
        createdAt: commentBadges.createdAt,
      })
      .from(commentBadges)
      .innerJoin(comments, eq(comments.id, commentBadges.commentId))
      .where(eq(comments.authorName, req.user?.username || ""))
      .orderBy(desc(commentBadges.createdAt));

    // Get managed data products
    const managedProducts = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(dataProducts)
      .where(eq(dataProducts.owner, req.user?.username || ""));

    // Calculate quality improvements
    const qualityImprovements = await db
      .select({
        count: sql<number>`count(distinct ${qualityMetrics.dataProductId})`.mapWith(Number)
      })
      .from(qualityMetrics)
      .where(
        and(
          sql`${qualityMetrics.value} > lag(${qualityMetrics.value}) over (partition by ${qualityMetrics.dataProductId} order by ${qualityMetrics.timestamp})`
        )
      );

    // Calculate quality trend
    const qualityTrend = await db
      .select({
        date: sql<string>`date_trunc('day', ${qualityMetrics.timestamp})::text`,
        score: sql<number>`avg(${qualityMetrics.value})`.mapWith(Number)
      })
      .from(qualityMetrics)
      .groupBy(sql`date_trunc('day', ${qualityMetrics.timestamp})`)
      .orderBy(sql`date_trunc('day', ${qualityMetrics.timestamp})`);

    // Calculate reputation score based on various factors
    const reputationScore = 
      (userComments[0]?.helpfulCount || 0) * 10 + // Points for helpful comments
      (badges.length * 20) + // Points for badges
      (qualityImprovements[0]?.count || 0) * 15 + // Points for improvements
      (managedProducts[0]?.count || 0) * 25; // Points for managed products

    // Format badges with descriptive names
    const formattedBadges = badges.map(badge => ({
      type: badge.type,
      name: `${badge.type.charAt(0).toUpperCase()}${badge.type.slice(1)} Badge`,
      description: getBadgeDescription(badge.type),
      earnedAt: badge.createdAt.toISOString()
    }));

    // Get recent activities
    const recentActivities = await getRecentActivities(req.user?.username || "");

    res.json({
      totalComments: userComments[0]?.totalCount || 0,
      helpfulComments: userComments[0]?.helpfulCount || 0,
      qualityImprovements: qualityImprovements[0]?.count || 0,
      dataProductsManaged: managedProducts[0]?.count || 0,
      reputationScore,
      level: calculateLevel(reputationScore),
      badges: formattedBadges,
      recentActivities,
      qualityTrend: qualityTrend.map(trend => ({
        date: trend.date,
        score: trend.score
      }))
    });
  } catch (error) {
    console.error("Error fetching stewardship metrics:", error);
    res.status(500).json({ message: "Failed to fetch stewardship metrics" });
  }
});

function getBadgeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    quality: "Consistently provided high-quality metadata improvements",
    trending: "Created highly engaging discussions about data products",
    influential: "Significantly impacted data product quality through feedback"
  };
  return descriptions[type] || "Achievement unlocked!";
}

async function getRecentActivities(username: string) {
  const recentComments = await db
    .select({
      type: sql<string>`'comment'`,
      timestamp: comments.createdAt,
      content: comments.content
    })
    .from(comments)
    .where(eq(comments.authorName, username))
    .orderBy(desc(comments.createdAt))
    .limit(5);

  return recentComments.map(activity => ({
    type: activity.type,
    description: `Added a comment: "${activity.content.slice(0, 50)}${activity.content.length > 50 ? '...' : ''}"`,
    timestamp: activity.timestamp.toISOString(),
    impact: 10 // Base impact score for comments
  }));
}

export default router;