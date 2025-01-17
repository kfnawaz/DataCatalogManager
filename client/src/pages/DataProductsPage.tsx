import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (productId) {
      const id = parseInt(productId);
      if (!isNaN(id)) {
        setSelectedDataProduct(id);
      }
    }
  }, []);

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
  });

  const isLoading = isLoadingAll || (selectedDataProduct !== null && isLoadingSelected);

  return (
    <TooltipProvider>
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background"
      >
        <div className="flex h-screen bg-background">
          <div 
            className={`relative transition-all duration-300 ease-in-out border-r ${
              isCollapsed 
                ? 'w-[50px] min-w-[50px]' 
                : 'w-[300px] min-w-[300px]'
            }`}
          >
            <div className={`p-3 h-full transition-opacity duration-300 ${
              isCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'
            }`}>
              <SearchBar 
                onSelect={handleProductSelect} 
                initialValue={selectedDataProduct} 
                className="search-bar" 
              />
              {isLoadingAll ? (
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : allDataProducts ? (
                <div className="mt-4">
                  <HierarchicalView
                    dataProducts={allDataProducts}
                    onSelect={handleProductSelect}
                    selectedId={selectedDataProduct}
                  />
                </div>
              ) : null}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-2 transition-all duration-300 ${
                isCollapsed 
                  ? 'right-[-12px]' 
                  : 'right-[-12px]'
              } z-10 h-6 w-6 rounded-full p-0 hover:bg-muted`}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isCollapsed ? 'Expand' : 'Collapse'} sidebar
              </span>
            </Button>
          </div>

          <div className="flex-1 min-w-0 flex flex-col h-screen">
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div {...fadeIn} key="loading" className="p-3">
                  <Skeleton className="h-8 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <Skeleton className="h-[400px]" />
                </motion.div>
              )}

              {!isLoading && selectedProduct && (
                <motion.div {...fadeIn} key={selectedProduct.id} className="flex flex-col h-full p-3">
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
                    className="flex-1 flex flex-col"
                  >
                    <TabsList>
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
                      <TabsTrigger value="lineage">Lineage</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 mt-4">
                      <AnimatePresence mode="wait">
                        <TabsContent value="metadata" asChild key="metadata" className="h-full">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                          >
                            <Card className="h-full">
                              <CardHeader className="border-b">
                                <h3 className="text-lg font-semibold">Metadata Management</h3>
                              </CardHeader>
                              <CardContent className="flex-1 overflow-hidden">
                                <MetadataPanel dataProductId={selectedDataProduct} />
                              </CardContent>
                            </Card>
                          </motion.div>
                        </TabsContent>

                        <TabsContent value="quality" asChild key="quality" className="h-full">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                          >
                            <Card className="h-full">
                              <CardHeader className="border-b">
                                <h3 className="text-lg font-semibold">Quality Metrics</h3>
                              </CardHeader>
                              <CardContent className="h-[calc(100%-4rem)]">
                                <QualityMetrics dataProductId={selectedDataProduct} />
                              </CardContent>
                            </Card>
                          </motion.div>
                        </TabsContent>

                        <TabsContent value="lineage" asChild key="lineage" className="h-full">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                          >
                            <Card className="h-full">
                              <CardContent className="pt-6 h-full">
                                <LineageGraph dataProductId={selectedDataProduct} />
                              </CardContent>
                            </Card>
                          </motion.div>
                        </TabsContent>
                      </AnimatePresence>
                    </div>
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