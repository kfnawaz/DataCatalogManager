import { Switch, Route } from "wouter";
import DataProductsPage from "./pages/DataProductsPage";
import MetricDefinitionsPage from "./pages/MetricDefinitionsPage";
import HomePage from "./pages/HomePage";
import NavBar from "./components/navigation/NavBar";
import { AutomatedTour } from "./components/onboarding/AutomatedTour";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/data-products" component={DataProductsPage} />
        <Route path="/metric-definitions" component={MetricDefinitionsPage} />
      </Switch>
      <AutomatedTour />
    </div>
  );
}

export default App;