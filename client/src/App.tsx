import { Switch, Route } from "wouter";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/dashboard" component={DashboardPage} />
    </Switch>
  );
}

export default App;