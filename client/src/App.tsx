import { Switch, Route } from "wouter";
import { Loader2 } from "lucide-react";
import DashboardPage from "./pages/DashboardPage";

function App() {
  // Bypass authentication and provide a default user
  const defaultUser = {
    id: 1,
    username: 'guest',
    role: 'user',
  };

  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/dashboard" component={DashboardPage} />
    </Switch>
  );
}

export default App;