import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
//if (process.env.NODE_ENV === "development") {
	require("tachyons");
//	require("./index.css");
//} else {
	require("./index.css");
//}

ReactDOM.render(<App />, document.getElementById("map-root"));
