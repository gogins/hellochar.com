import * as React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { FullPageSketch } from "./routes/fullPageSketch";
import { HomePage } from "./routes/homePage";
import { ISketch } from "./sketch";
import sketches = require("./sketches");

const sketchRoutes = sketches.map((sketchClass) => {
    const path = `/${sketchClass.id}`;
    return <Route key={path} path={path} component={() => <FullPageSketch sketchClass={sketchClass} />} />;
});

export const Routes = () => (
    <Switch>
        { sketchRoutes }
        <Route path="/" component={HomePage} />
    </Switch>
);
