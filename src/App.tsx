import React from "react";
import { Route, Switch } from "wouter";
import HomePage from "./pages/home";
import TokenizationPage from "./pages/tokenization";
import NotFound from "./pages/not-found";

// App con página de inicio y página de tokenización
const App = () => {
  return (
    <div className="app-container">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/tokenizacion" component={TokenizationPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

export default App;