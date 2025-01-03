import { Switch, Route } from "wouter";
import DataProductsPage from "./pages/DataProductsPage";
import MetricDefinitionsPage from "./pages/MetricDefinitionsPage";
import HomePage from "./pages/HomePage";
import NavBar from "./components/navigation/NavBar";
import { DataWellnessCompanion } from "./components/wellness/DataWellnessCompanion";
import DataStewardDashboard from "./components/dashboard/DataStewardDashboard";

// Temporary auth simulation - replace with proper auth later
const TEMP_USER = {
  username: "test_steward",
  displayName: "Test Steward",
};

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/data-products" component={DataProductsPage} />
          <Route path="/metric-definitions" component={MetricDefinitionsPage} />
          <Route path="/stewardship">
            {() => (
              <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Data Stewardship Dashboard</h1>
                <DataStewardDashboard />
              </div>
            )}
          </Route>
        </Switch>
      </main>
      {/* Chat companion with increased visibility */}
      <div className="fixed bottom-4 right-4 z-50">
        <DataWellnessCompanion />
      </div>
    </div>
  );
}

export default App;