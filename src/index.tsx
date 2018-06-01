import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./app";
import "./monkeypatchThree";

const root = document.createElement("div");
document.body.appendChild(root);
root.className = "root";
ReactDOM.render(<App />, root);
