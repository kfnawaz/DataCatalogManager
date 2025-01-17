import { db } from "@db";
import { sql } from "drizzle-orm";

export async function resetDatabase() {
  try {
    // Drop all data from tables
    await db.execute(
      sql`TRUNCATE TABLE data_products, metric_templates, metric_definitions, quality_metrics, comments, comment_reactions, comment_badges, api_usage, lineage_nodes, lineage_edges, lineage_versions, stewardship_profiles, achievements, earned_achievements, stewardship_activities, stewardship_challenges, challenge_participation, node_quality_metrics, metric_definition_versions CASCADE;`,
    );

    // Reset all sequences
    await db.execute(sql`
      ALTER SEQUENCE data_products_id_seq RESTART WITH 1;
      ALTER SEQUENCE metric_templates_id_seq RESTART WITH 1;
      ALTER SEQUENCE metric_definitions_id_seq RESTART WITH 1;
      ALTER SEQUENCE quality_metrics_id_seq RESTART WITH 1;
      ALTER SEQUENCE comments_id_seq RESTART WITH 1;
      ALTER SEQUENCE comment_reactions_id_seq RESTART WITH 1;
      ALTER SEQUENCE comment_badges_id_seq RESTART WITH 1;
      ALTER SEQUENCE api_usage_id_seq RESTART WITH 1;
      ALTER SEQUENCE lineage_nodes_id_seq RESTART WITH 1;
      ALTER SEQUENCE lineage_edges_id_seq RESTART WITH 1;
      ALTER SEQUENCE lineage_versions_id_seq RESTART WITH 1;
      ALTER SEQUENCE stewardship_profiles_id_seq RESTART WITH 1;
      ALTER SEQUENCE achievements_id_seq RESTART WITH 1;
      ALTER SEQUENCE earned_achievements_id_seq RESTART WITH 1;
      ALTER SEQUENCE stewardship_activities_id_seq RESTART WITH 1;
      ALTER SEQUENCE stewardship_challenges_id_seq RESTART WITH 1;
      ALTER SEQUENCE challenge_participation_id_seq RESTART WITH 1;
      ALTER SEQUENCE node_quality_metrics_id_seq RESTART WITH 1;
      ALTER SEQUENCE metric_definition_versions_id_seq RESTART WITH 1;
    `);

    console.log("✅ Database reset successfully!");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}
