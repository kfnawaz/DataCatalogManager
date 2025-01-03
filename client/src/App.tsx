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
      <DataWellnessCompanion />
    </div>
  );
}

export default App;