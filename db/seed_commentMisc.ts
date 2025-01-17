
import { db } from "@db";
import { comments, commentReactions, commentBadges } from "@db/schema";

export async function seed_commentMisc() {
  try {
    // Get all data products
    const dataProducts = await db.query.dataProducts.findMany();

    for (const dataProduct of dataProducts) {
      // Create 2-3 comments for each data product
      const commentValues = [
        {
          dataProductId: dataProduct.id,
          content: `Great documentation for ${dataProduct.name}. The schema is well-structured and clear.`,
          authorName: "Data Steward",
        },
        {
          dataProductId: dataProduct.id,
          content: `The ${dataProduct.updateFrequency} update frequency works well for our use case.`,
          authorName: "Data Engineer",
        },
        {
          dataProductId: dataProduct.id,
          content: `${dataProduct.sla} SLA is crucial for our downstream dependencies.`,
          authorName: "Product Owner",
        },
      ];

      const insertedComments = await db.insert(comments).values(commentValues).returning();

      // Add reactions to each comment
      for (const comment of insertedComments) {
        const reactionTypes = ["like", "helpful", "insightful"];
        const userIdentifiers = [
          "user_123_steward",
          "user_456_engineer",
          "user_789_analyst",
          "user_101_architect"
        ];

        // Add 2-4 random reactions to each comment
        const numReactions = Math.floor(Math.random() * 3) + 2;
        const reactions = Array.from({ length: numReactions }, () => ({
          commentId: comment.id,
          type: reactionTypes[Math.floor(Math.random() * reactionTypes.length)],
          userIdentifier: userIdentifiers[Math.floor(Math.random() * userIdentifiers.length)],
        }));

        await db.insert(commentReactions).values(reactions);

        // Add badges based on reaction count
        if (numReactions >= 3) {
          await db.insert(commentBadges).values({
            commentId: comment.id,
            type: "trending",
          });
        }

        // Add quality badge for longer, detailed comments
        if (comment.content.length > 100) {
          await db.insert(commentBadges).values({
            commentId: comment.id,
            type: "quality",
          });
        }
      }
    }

    console.log("✅ Comments, reactions, and badges seeded successfully");
  } catch (error) {
    console.error("Error seeding comments data:", error);
    throw error;
  }
}
