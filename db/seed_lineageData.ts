
import { db } from "@db";
import { lineageNodes, lineageEdges, lineageVersions } from "@db/schema";

export async function seed_lineageData() {
  try {
    // Get all data products to create nodes
    const dataProducts = await db.query.dataProducts.findMany();

    // Create nodes for each data product
    const nodes = await Promise.all(
      dataProducts.map(async (dp) => {
        return await db
          .insert(lineageNodes)
          .values({
            name: dp.name,
            type: dp.name.toLowerCase().includes('var report') ? 'consumer-aligned' : 
                  dp.name.toLowerCase().includes('metrics') || 
                  dp.name.toLowerCase().includes('testing') || 
                  dp.name.toLowerCase().includes('factors') ? 'aggregate' : 
                  'source-aligned',
            dataProductId: dp.id,
            metadata: {
              domain: dp.domain,
              owner: dp.owner,
              description: dp.description
            },
            version: 1
          })
          .returning();
      })
    );

    console.log("✅ Lineage Nodes seeded successfully!");
    
    // Create edges based on source information
    const edgesToCreate = [];
    const nodeMap = new Map(nodes.flat().map(n => [n.name, n.id]));

    // Mapping for known relationships based on provided documentation
    const relationships = {
      'VaR Report Data Product': [
        'Portfolio Risk Metrics',
        'Market Data',
        'Trade and Position Data',
        'Stress Testing Data'
      ],
      'Portfolio Risk Metrics': [
        'Market Risk Factors Aggregate',
        'Trade and Position Data',
        'Counterparty Risk Metrics'
      ],
      'Stress Testing Data': [
        'Market Data',
        'Reference Data'
      ],
      'Market Risk Factors Aggregate': [
        'Market Data',
        'Regulatory Metrics'
      ],
      'Counterparty Risk Metrics': [
        'Credit Risk Data',
        'Reference Data'
      ],
      'Regulatory Metrics': [
        'Risk Factor Data',
        'Reference Data'
      ]
    };

    // Create edges based on relationships
    for (const [target, sources] of Object.entries(relationships)) {
      const targetNode = nodes.flat().find(n => n.name === target);
      if (!targetNode) continue;

      for (const source of sources) {
        const sourceNode = nodes.flat().find(n => n.name === source);
        if (!sourceNode) continue;

        edgesToCreate.push({
          sourceId: sourceNode.id,
          targetId: targetNode.id,
          metadata: { relationship: "data_flow" },
          transformationLogic: "Data transformation and integration",
          version: 1
        });
      }
    }

    // Insert edges
    if (edgesToCreate.length > 0) {
      await db.insert(lineageEdges).values(edgesToCreate);
    }

    console.log("✅ Lineage Edges seeded successfully!");

    // Create initial version record for each data product
    await db.insert(lineageVersions).values(
      await Promise.all(dataProducts.map(async (dp) => {
        // Get all nodes and edges for this data product
        const dpNodes = nodes.flat().filter(n => n.dataProductId === dp.id);
        const dpEdges = edgesToCreate.filter(e => 
          dpNodes.some(n => n.id === e.sourceId || n.id === e.targetId)
        );

        return {
          dataProductId: dp.id,
          version: 1,
          snapshot: {
            nodes: dpNodes.map(n => ({
              id: n.id,
              name: n.name,
              type: n.type,
              metadata: n.metadata
            })),
            edges: dpEdges.map(e => ({
              sourceId: e.sourceId,
              targetId: e.targetId,
              metadata: e.metadata,
              transformationLogic: e.transformationLogic
            }))
          },
          changeMessage: "Initial lineage setup",
          createdBy: "system"
        };
      }))
    );

    console.log("✅ Lineage versions seeded successfully!");
  } catch (error) {
    console.error("Error seeding lineage data:", error);
    throw error;
  }
}
