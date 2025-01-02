import { Switch, Route } from "wouter";
import DataProductsPage from "./pages/DataProductsPage";
import MetricDefinitionsPage from "./pages/MetricDefinitionsPage";
import HomePage from "./pages/HomePage";
import NavBar from "./components/navigation/NavBar";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/data-products" component={DataProductsPage} />
        <Route path="/metric-definitions" component={MetricDefinitionsPage} />
      </Switch>
    </div>
  );
}

export default App;