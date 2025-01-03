import { Switch, Route } from "wouter";
import DataProductsPage from "./pages/DataProductsPage";
import MetricDefinitionsPage from "./pages/MetricDefinitionsPage";
import HomePage from "./pages/HomePage";
import DataStewardshipPage from "./pages/DataStewardshipPage";
import NavBar from "./components/navigation/NavBar";
import { DataWellnessCompanion } from "./components/wellness/DataWellnessCompanion";

// Temporary auth simulation - replace with proper auth later
const TEMP_USER = {
  username: "test_steward",
  displayName: "Test Steward",
};

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container mx-auto">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/data-products" component={DataProductsPage} />
          <Route path="/metric-definitions" component={MetricDefinitionsPage} />
          <Route path="/stewardship" component={DataStewardshipPage} />
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