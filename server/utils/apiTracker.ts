import { db } from "@db";
import { apiUsage } from "@db/schema";

export async function trackApiUsage(
  endpoint: string,
  statusCode: number,
  errorType?: string,
  quotaUsed?: number,
  metadata?: Record<string, any>
) {
  try {
    await db.insert(apiUsage).values({
      endpoint,
      statusCode,
      errorType,
      quotaUsed,
      metadata,
      isSuccessful: statusCode >= 200 && statusCode < 300,
    });
  } catch (error) {
    console.error("Failed to track API usage:", error);
  }
}

export async function getApiUsageStats(timeframe: 'day' | 'week' | 'month' = 'day') {
  const intervals = {
    day: "NOW() - INTERVAL '1 day'",
    week: "NOW() - INTERVAL '7 days'",
    month: "NOW() - INTERVAL '30 days'",
  };

  try {
    const stats = await db.execute(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) as successful_requests,
        SUM(quota_used) as total_quota_used,
        COUNT(DISTINCT error_type) as unique_errors
      FROM api_usage 
      WHERE timestamp >= ${intervals[timeframe]}`
    );

    const hourlyUsage = await db.execute(
      `SELECT 
        date_trunc('hour', timestamp) as hour,
        COUNT(*) as requests,
        SUM(CASE WHEN is_successful THEN 1 ELSE 0 END) as successful
      FROM api_usage 
      WHERE timestamp >= ${intervals[timeframe]}
      GROUP BY hour 
      ORDER BY hour`
    );

    return {
      summary: stats[0],
      hourlyUsage,
    };
  } catch (error) {
    console.error("Failed to get API usage stats:", error);
    throw error;
  }
}
