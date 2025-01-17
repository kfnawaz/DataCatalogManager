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
  exit: { opacity: 0, y: -20 },
};

export default function DataProductsPage() {
  const [selectedDataProduct, setSelectedDataProduct] = useState<number | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("metadata");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product");
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

  const { data: allDataProducts, isLoading: isLoadingAll } = useQuery<
    DataProduct[]
  >({
    queryKey: ["/api/data-products"],
  });

  const { data: selectedProduct, isLoading: isLoadingSelected } =
    useQuery<DataProduct>({
      queryKey: [`/api/metadata/${selectedDataProduct}`],
      enabled: selectedDataProduct !== null,
    });

  const isLoading =
    isLoadingAll || (selectedDataProduct !== null && isLoadingSelected);

  return (
    <TooltipProvider>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-screen flex flex-col bg-background"
      >
        <div className="flex flex-1 overflow-hidden">
          <div
            className={`relative transition-all duration-300 ease-in-out border-r ${
              isCollapsed ? "w-[50px] min-w-[50px]" : "w-[300px] min-w-[300px]"
            }`}
          >
            <div
              className={`h-full transition-opacity duration-300 ${
                isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
              }`}
            >
              <div className="p-2">
                <SearchBar
                  onSelect={handleProductSelect}
                  initialValue={selectedDataProduct}
                  className="search-bar"
                />
              </div>
              {isLoadingAll ? (
                <div className="space-y-2 mt-4 px-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : allDataProducts ? (
                <div className="mt-2 px-2">
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
                isCollapsed ? "right-[-12px]" : "right-[-12px]"
              } z-10 h-6 w-6 rounded-full p-0 hover:bg-muted`}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isCollapsed ? "Expand" : "Collapse"} sidebar
              </span>
            </Button>
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div {...fadeIn} key="loading" className="p-2">
                  <Skeleton className="h-8 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-[400px]" />
                </motion.div>
              )}

              {!isLoading && selectedProduct && (
                <motion.div
                  {...fadeIn}
                  key={selectedProduct.id}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  <div className="p-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      {selectedProduct.name}
                    </h2>
                    {selectedProduct.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {selectedProduct.description}
                      </p>
                    )}
                  </div>

                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 flex flex-col mt-2 overflow-hidden"
                  >
                    <TabsList className="px-2">
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                      <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
                      <TabsTrigger value="lineage">Lineage</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 p-2 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <TabsContent
                          value="metadata"
                          asChild
                          key="metadata"
                          className="h-full"
                        >
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                          >
                            <Card className="h-full flex flex-col">
                              <CardHeader className="border-b py-2">
                                <h3 className="text-lg font-semibold">
                                  Metadata Management
                                </h3>
                              </CardHeader>
                              <CardContent className="flex-1 h-[calc(100vh-8rem)]">
                                <MetadataPanel
                                  dataProductId={selectedDataProduct}
                                />
                              </CardContent>
                            </Card>
                          </motion.div>
                        </TabsContent>

                        <TabsContent
                          value="quality"
                          asChild
                          key="quality"
                          className="h-full"
                        >
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                          >
                            <Card className="h-full flex flex-col">
                              <CardHeader className="border-b py-2">
                                <h3 className="text-lg font-semibold">
                                  Quality Metrics
                                </h3>
                              </CardHeader>
                              <CardContent className="flex-1">
                                <QualityMetrics
                                  dataProductId={selectedDataProduct}
                                />
                              </CardContent>
                            </Card>
                          </motion.div>
                        </TabsContent>

                        <TabsContent
                          value="lineage"
                          asChild
                          key="lineage"
                          className="h-full"
                        >
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                          >
                            <Card className="h-full flex flex-col">
                              <CardContent className="flex-1">
                                <LineageGraph
                                  dataProductId={selectedDataProduct}
                                />
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
                <motion.div
                  {...fadeIn}
                  key="empty"
                  className="text-center py-12 text-muted-foreground"
                >
                  Select a data product from the search bar or hierarchical view
                  to see its details
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.main>
    </TooltipProvider>
  );
}
