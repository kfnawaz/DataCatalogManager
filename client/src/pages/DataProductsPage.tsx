import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MetadataPanel from "../components/metadata/MetadataPanel";
import LineageGraph from "../components/lineage/LineageGraph";
import QualityMetrics from "../components/quality/QualityMetrics";
import SearchBar from "../components/search/SearchBar";
import QuickFilterSidebar from "../components/metadata/QuickFilterSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import DataProductComments from "../components/comments/DataProductComments";

interface DataProduct {
  id: number;
  name: string;
  description?: string;
  owner: string;
  schema: {
    columns: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  };
  tags?: string[];
  sla?: string;
  updateFrequency?: string;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export default function DataProductsPage() {
  const [selectedDataProduct, setSelectedDataProduct] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("metadata");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (productId) {
      setSelectedDataProduct(parseInt(productId));
    }
  }, []);

  const { data: selectedProduct, isLoading } = useQuery<DataProduct>({
    queryKey: [`/api/metadata/${selectedDataProduct}`],
    enabled: selectedDataProduct !== null,
  });

  const handleFiltersChange = (filters: Record<string, string[]>) => {
    setActiveFilters(filters);
    // TODO: Apply filters to data products query
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-background relative"
    >
      {/* Quick Filter Sidebar */}
      <QuickFilterSidebar 
        onFiltersChange={handleFiltersChange} 
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-[1] bg-background/80 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="h-14 flex items-center px-6">
            <h1 className="text-lg font-semibold">Data Products</h1>
          </div>
        </div>

        {/* Content Area with Search Bar */}
        <div className="flex-1 mt-14"> 
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Centered Search Section */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Find Data Products</h2>
              <div className="max-w-2xl mx-auto">
                <SearchBar onSelect={setSelectedDataProduct} initialValue={selectedDataProduct} />
              </div>
            </div>

            {/* Data Product Content */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div {...fadeIn} key="loading">
                  <Skeleton className="h-8 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <Skeleton className="h-[400px]" />
                </motion.div>
              ) : selectedProduct ? (
                <motion.div {...fadeIn} key={selectedProduct.id} className="relative z-[2]"> 
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                      {selectedProduct.name}
                    </h2>
                    {selectedProduct.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedProduct.description}
                      </p>
                    )}
                  </div>

                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab} 
                    className="space-y-4"
                  >
                    <TabsList className="relative z-[5]"> 
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      <TabsTrigger value="lineage">Lineage</TabsTrigger>
                      <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                      <TabsContent value="metadata" asChild>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <div className="space-y-4">
                            <Card>
                              <CardHeader>
                                <CardTitle>Metadata Management</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <MetadataPanel dataProductId={selectedProduct.id} />
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle>Comments & Annotations</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <DataProductComments dataProductId={selectedProduct.id} />
                              </CardContent>
                            </Card>
                          </div>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="lineage" asChild>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Card>
                            <CardHeader>
                              <CardTitle>Data Lineage</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <LineageGraph dataProductId={selectedProduct.id} />
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="quality" asChild>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                        >
                          <Card>
                            <CardHeader>
                              <CardTitle>Quality Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <QualityMetrics dataProductId={selectedProduct.id} />
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TabsContent>
                    </AnimatePresence>
                  </Tabs>
                </motion.div>
              ) : (
                <motion.div {...fadeIn} key="empty" className="text-center py-12 text-muted-foreground">
                  Please use the search above to find and select a data product
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.main>
  );
}