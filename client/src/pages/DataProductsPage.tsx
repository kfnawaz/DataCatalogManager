import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import MetadataPanel from "../components/metadata/MetadataPanel";
import LineageGraph from "../components/lineage/LineageGraph";
import QualityMetrics from "../components/quality/QualityMetrics";
import SearchBar from "../components/search/SearchBar";
import HierarchicalView from "../components/metadata/HierarchicalView";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import DataProductComments from "../components/comments/DataProductComments";

interface DataProduct {
  id: number;
  name: string;
  description?: string;
  owner: string;
  domain: string;
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const productId = params.get('product');
    if (productId) {
      const id = parseInt(productId);
      if (!isNaN(id)) {
        setSelectedDataProduct(id);
      }
    }
  }, [location.search]);

  const handleProductSelect = (id: number) => {
    setSelectedDataProduct(id);
    navigate(`/data-products?product=${id}`);
  };

  const { data: allDataProducts, isLoading: isLoadingAll } = useQuery<DataProduct[]>({
    queryKey: ['/api/data-products'],
  });

  const { data: selectedProduct, isLoading: isLoadingSelected } = useQuery<DataProduct>({
    queryKey: [`/api/metadata/${selectedDataProduct}`],
    enabled: selectedDataProduct !== null,
    retry: false,
  });

  const isLoading = isLoadingAll || (selectedDataProduct !== null && isLoadingSelected);

  return (
    <TooltipProvider>
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-6"
      >
        <div className="grid grid-cols-[300px_1fr] gap-6">
          <div className="space-y-4">
            <SearchBar 
              onSelect={handleProductSelect} 
              initialValue={selectedDataProduct} 
              className="search-bar" 
            />
            {isLoadingAll ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : allDataProducts ? (
              <HierarchicalView
                dataProducts={allDataProducts}
                onSelect={handleProductSelect}
                selectedId={selectedDataProduct}
              />
            ) : null}
          </div>

          <div>
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div {...fadeIn} key="loading">
                  <Skeleton className="h-8 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <Skeleton className="h-[400px]" />
                </motion.div>
              )}

              {!isLoading && selectedProduct && (
                <motion.div {...fadeIn} key={selectedProduct.id}>
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
                    <TabsList>
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
                      <TabsTrigger value="lineage">Lineage</TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                      <TabsContent value="metadata" asChild key="metadata">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <Card>
                            <CardHeader>
                              <h3 className="text-lg font-semibold">Metadata Management</h3>
                            </CardHeader>
                            <CardContent>
                              <MetadataPanel dataProductId={selectedDataProduct} />
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="quality" asChild key="quality">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <Card>
                            <CardHeader>
                              <h3 className="text-lg font-semibold">Quality Metrics</h3>
                            </CardHeader>
                            <CardContent>
                              <QualityMetrics dataProductId={selectedDataProduct} />
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="lineage" asChild key="lineage">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <Card>
                            <CardContent className="pt-6">
                              <LineageGraph dataProductId={selectedDataProduct} />
                            </CardContent>
                          </Card>
                        </motion.div>
                      </TabsContent>
                    </AnimatePresence>
                  </Tabs>
                </motion.div>
              )}

              {!isLoading && !selectedProduct && (
                <motion.div {...fadeIn} key="empty" className="text-center py-12 text-muted-foreground">
                  Select a data product from the search bar or hierarchical view to see its details
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.main>
    </TooltipProvider>
  );
}