import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Board from "./components/Board";
import "./App.css";

function App() {
    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app">
                <h1>Enten gegen Schnecken</h1>
                <Board />
            </div>
        </DndProvider>
    );
}

export default App;