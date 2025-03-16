import React from "react";
import { Route, Switch } from "wouter";
import HomePage from "./pages/home";
import TokenizationPage from "./pages/tokenization";
import NotFound from "./pages/not-found";
import AffiliatePage from "./pages/affiliates";
import AffiliateRedirect from "./pages/affiliate-redirect";

// App con rutas para la plataforma 
const App = () => {
  return (
    <div className="app-container">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/tokenizacion" component={TokenizationPage} />
        <Route path="/afiliados" component={AffiliatePage} />
        <Route path="/affiliate/:linkId/:slug?" component={AffiliateRedirect} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
};

export default App;