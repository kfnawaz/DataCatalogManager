import { Switch, Route } from "wouter";
import DataProductsPage from "./pages/DataProductsPage";
import MetricDefinitionsPage from "./pages/MetricDefinitionsPage";
import HomePage from "./pages/HomePage";
import NavBar from "./components/navigation/NavBar";
import { DataWellnessCompanion } from "./components/wellness/DataWellnessCompanion";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/data-products" component={DataProductsPage} />
        <Route path="/metric-definitions" component={MetricDefinitionsPage} />
      </Switch>
      {/* Chat companion with increased visibility */}
      <div className="fixed bottom-4 right-4 z-50">
        <DataWellnessCompanion />
      </div>
    </div>
  );
}

export default App;