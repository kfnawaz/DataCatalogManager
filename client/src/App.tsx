import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import DataProductsPage from "./pages/DataProductsPage";
import MetricDefinitionsPage from "./pages/MetricDefinitionsPage";
import HomePage from "./pages/HomePage";
import NavBar from "./components/navigation/NavBar";
import PageTransition from "./components/transitions/PageTransition";

function App() {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <AnimatePresence mode="wait" initial={false}>
        <Switch key={location}>
          <Route path="/">
            <PageTransition>
              <HomePage />
            </PageTransition>
          </Route>
          <Route path="/data-products">
            <PageTransition>
              <DataProductsPage />
            </PageTransition>
          </Route>
          <Route path="/metric-definitions">
            <PageTransition>
              <MetricDefinitionsPage />
            </PageTransition>
          </Route>
        </Switch>
      </AnimatePresence>
    </div>
  );
}

export default App;