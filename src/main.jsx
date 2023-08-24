import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Editor, { loader } from "./Editor";
import Login from "./Login";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
  },
  {
    path: "/editor/:noteID", element: <Editor />, loader: loader
  }
])

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
