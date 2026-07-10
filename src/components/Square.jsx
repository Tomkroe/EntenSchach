import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { pieces } from "../data/pieces";

function Square({ dark, piece, row, col, onMove }) {
    const backgroundColor = dark ? "#ff66cc" : "#ffea00";
    const pieceData = pieces && piece ? pieces[piece] : null;

    const [{ isOver }, drop] = useDrop(() => ({
        accept: "CHESS_PIECE",
        drop: (item) => {
            onMove(item.row, item.col, row, col);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }), [row, col, onMove]);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CHESS_PIECE",
        item: { row, col },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [row, col, piece]);

    return (
        <div
            ref={drop}
            style={{
                backgroundColor: isOver ? "#a8ffb2" : backgroundColor,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                position: "relative",
                opacity: isDragging ? 0.4 : 1
            }}
        >
            {pieceData && pieceData.image ? (
                <img
                    ref={drag}
                    src={pieceData.image}
                    alt={pieceData.type}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                        cursor: "grab"
                    }}
                />
            ) : (
                piece && <span style={{
                    position: "absolute",
                    color: "black",
                    fontSize: "11px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap"
                }}>{piece}</span>
            )}
        </div>
    );
}

export default Square;