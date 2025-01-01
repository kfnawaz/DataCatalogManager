import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import MetadataPanel from "../components/metadata/MetadataPanel";
import LineageGraph from "../components/lineage/LineageGraph";
import QualityMetrics from "../components/quality/QualityMetrics";
import SearchBar from "../components/search/SearchBar";
import { ThemeToggle } from "../components/theme/theme-toggle";
import { LogOut } from "lucide-react";

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

export default function DashboardPage() {
  const { user, logout } = useUser();
  const [selectedDataProduct, setSelectedDataProduct] = useState<number | null>(null);

  const { data: selectedProduct } = useQuery<DataProduct>({
    queryKey: ["/api/metadata", selectedDataProduct],
    enabled: selectedDataProduct !== null,
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Data Catalog
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <SearchBar onSelect={setSelectedDataProduct} />
        </div>

        {selectedProduct ? (
          <>
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

            <Tabs defaultValue="metadata" className="space-y-4">
              <TabsList>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="lineage">Lineage</TabsTrigger>
                <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="metadata">
                <Card>
                  <CardHeader>
                    <CardTitle>Metadata Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MetadataPanel dataProductId={selectedDataProduct} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lineage">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Lineage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineageGraph dataProductId={selectedDataProduct} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quality">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QualityMetrics dataProductId={selectedDataProduct} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Use the search bar above to find and select a data product
          </div>
        )}
      </main>
    </div>
  );
}