import { Switch, Route } from "wouter";
import DashboardPage from "./pages/DashboardPage";
import MetricDefinitionsPage from "./pages/MetricDefinitionsPage";
import NavBar from "./components/navigation/NavBar";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/metric-definitions" component={MetricDefinitionsPage} />
      </Switch>
    </div>
  );
}

export default App;