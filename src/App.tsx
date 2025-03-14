import React from "react";
import { Route, Switch } from "wouter";
import HomePage from "./pages/home";
import NotFound from "./pages/not-found";

// Versión simplificada de App para mostrar solo la página de inicio
const App = () => {
  return (
    <div className="app-container">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

export default App;