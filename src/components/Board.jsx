import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Square from "./Square";
import {
    validateBauer,
    validateTurm,
    validateLaeufer,
    validateSpringer,
    validateDame,
    validateKoenig
} from "./figures";

const BACKEND_URL = window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://DEIN-BACKEND-NAME.onrender.com";

const socket = io(BACKEND_URL);

function Board() {
    const [roomCode, setRoomCode] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [isJoined, setIsJoined] = useState(false);

    const [activeRooms, setActiveRooms] = useState([]);
    const [roomPlayers, setRoomPlayers] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]); // Neu: Bestenliste

    const [board, setBoard] = useState([]);
    const [isEntenTurn, setIsEntenTurn] = useState(true);
    const [winner, setWinner] = useState(null);
    const [myRole, setMyRole] = useState("Zuschauer");

    useEffect(() => {
        socket.on("roomListUpdate", (rooms) => {
            setActiveRooms(rooms);
        });

        socket.on("leaderboardUpdate", (data) => {
            setLeaderboard(data);
        });

        socket.on("init", (data) => {
            setMyRole(data.role);
            setBoard(data.gameState.board);
            setIsEntenTurn(data.gameState.isEntenTurn);
            setWinner(data.gameState.winner);
            setIsJoined(true);
        });

        socket.on("playersUpdate", (players) => {
            setRoomPlayers(players);
        });

        socket.on("gameStateUpdate", (data) => {
            setBoard(data.board);
            setIsEntenTurn(data.isEntenTurn);
            setWinner(data.winner);
        });

        // Beim ersten Laden der Komponente einmal Daten anfordern
        socket.emit("requestRefresh");

        return () => {
            socket.off("roomListUpdate");
            socket.off("leaderboardUpdate");
            socket.off("init");
            socket.off("playersUpdate");
            socket.off("gameStateUpdate");
        };
    }, []);

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (roomCode.trim() !== "" && playerName.trim() !== "") {
            socket.emit("joinRoom", { roomCode: roomCode.trim(), playerName: playerName.trim() });
        } else {
            alert("Bitte Name und Raum-Code eingeben!");
        }
    };

    const joinExistingRoom = (code) => {
        if (playerName.trim() === "") {
            alert("Bitte gib zuerst oben deinen Namen ein!");
            return;
        }
        setRoomCode(code);
        socket.emit("joinRoom", { roomCode: code, playerName: playerName.trim() });
    };

    const handleLeaveRoom = () => {
        socket.emit("leaveRoom");
        setIsJoined(false);
        setBoard([]);
    };

    const triggerRefresh = () => {
        socket.emit("requestRefresh");
    };

    const movePiece = (fromRow, fromCol, toRow, toCol) => {
        if (winner || board.length === 0) return;

        if (isEntenTurn && myRole !== "Enten") return;
        if (!isEntenTurn && myRole !== "Schnecken") return;

        const movingPiece = board[fromRow][fromCol];
        const targetPiece = board[toRow][toCol];

        if (!movingPiece) return;

        if (movingPiece.startsWith("E_") && !isEntenTurn) return;
        if (movingPiece.startsWith("S_") && isEntenTurn) return;

        if (targetPiece && movingPiece.substring(0, 2) === targetPiece.substring(0, 2)) return;

        let isValid = false;

        if (movingPiece.endsWith("Bauer")) {
            isValid = validateBauer(fromRow, fromCol, toRow, toCol, board, movingPiece, targetPiece);
        } else if (movingPiece.endsWith("Turm")) {
            isValid = validateTurm(fromRow, fromCol, toRow, toCol, board);
        } else if (movingPiece.endsWith("Laeufer")) {
            isValid = validateLaeufer(fromRow, fromCol, toRow, toCol, board);
        } else if (movingPiece.endsWith("Springer")) {
            isValid = validateSpringer(fromRow, fromCol, toRow, toCol);
        } else if (movingPiece.endsWith("Dame")) {
            isValid = validateDame(fromRow, fromCol, toRow, toCol, board);
        } else if (movingPiece.endsWith("Koenig")) {
            isValid = validateKoenig(fromRow, fromCol, toRow, toCol);
        }

        if (!isValid) return;

        let localWinner = winner;
        if (targetPiece && targetPiece.endsWith("Koenig")) {
            localWinner = isEntenTurn ? "Enten" : "Schnecken";
        }

        const newBoard = board.map(row => [...row]);
        newBoard[fromRow][fromCol] = null;
        newBoard[toRow][toCol] = movingPiece;

        const nextTurn = !isEntenTurn;

        socket.emit("makeMove", {
            roomCode: roomCode.trim(),
            newGameState: {
                board: newBoard,
                isEntenTurn: nextTurn,
                winner: localWinner
            }
        });
    };

    const resetGame = () => {
        fetch(`${BACKEND_URL}/api/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomCode: roomCode.trim() })
        });
    };

    const entenSpieler = roomPlayers.find(p => p.role === "Enten")?.name || "Wartet...";
    const schneckenSpieler = roomPlayers.find(p => p.role === "Schnecken")?.name || "Wartet...";

    // --- VIEW 1: Lobby ---
    if (!isJoined) {
        return (
            <div style={{ textAlign: "center", marginTop: "30px", fontFamily: "sans-serif" }}>
                <h2>🦆 Enten gegen Schnecken 🐌</h2>

                <form onSubmit={handleJoinRoom} style={{ marginBottom: "20px" }}>
                    <input
                        type="text"
                        placeholder="Dein Name..."
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        style={{ padding: "10px", fontSize: "16px", marginRight: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                    />
                    <input
                        type="text"
                        placeholder="Raum-Code..."
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        style={{ padding: "10px", fontSize: "16px", marginRight: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                    />
                    <button type="submit" style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", background: "#222", color: "#fff", border: "none", borderRadius: "5px" }}>
                        Erstellen / Beitreten
                    </button>
                </form>

                <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap", maxWidth: "900px", margin: "0 auto" }}>

                    {/* Linke Seite: Raumliste */}
                    <div style={{ flex: 1, minWidth: "300px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <h3>Aktive Räume:</h3>
                            <button onClick={triggerRefresh} style={{ padding: "5px 10px", cursor: "pointer", background: "#008CBA", color: "#fff", border: "none", borderRadius: "3px" }}>
                                🔄 Aktualisieren
                            </button>
                        </div>
                        {activeRooms.length === 0 ? (
                            <p style={{ color: "#777", textAlign: "left" }}>Keine aktiven Räume. Erstelle einen!</p>
                        ) : (
                            <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", textAlign: "left" }}>
                                {activeRooms.map(r => (
                                    <div key={r.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                                        <div>
                                            <strong>Raum: {r.code}</strong> <span style={{ fontSize: "12px", color: "#666" }}>({r.playerCount} im Raum)</span>
                                            <div style={{ fontSize: "14px", color: "#555" }}>🦆 {r.entenName} vs. 🐌 {r.schneckenName}</div>
                                        </div>
                                        <button onClick={() => joinExistingRoom(r.code)} style={{ padding: "5px 10px", cursor: "pointer", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "3px" }}>
                                            Beitreten
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rechte Seite: Leaderboard */}
                    <div style={{ width: "250px" }}>
                        <h3>🏆 Top 5 Leaderboard</h3>
                        <div style={{ background: "#fffdf3", padding: "15px", borderRadius: "8px", border: "1px solid #e2d19e", textAlign: "left" }}>
                            {leaderboard.length === 0 ? (
                                <p style={{ color: "#777", fontSize: "14px" }}>Noch keine Siege registriert.</p>
                            ) : (
                                <ol style={{ paddingLeft: "20px", margin: 0 }}>
                                    {leaderboard.map((player, idx) => (
                                        <li key={idx} style={{ padding: "4px 0", borderBottom: "1px solid #f3ebd4" }}>
                                            <strong>{player.name}</strong>: {player.wins} {player.wins === 1 ? "Sieg" : "Siege"}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    if (board.length === 0) return <div style={{ textAlign: "center", marginTop: "50px" }}>Lade...</div>;

    // --- VIEW 2: Spielbrett ---
    const squares = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const dark = (row + col) % 2 === 1;
            const piece = board[row][col];

            squares.push(
                <Square key={`${row}-${col}`} row={row} col={col} dark={dark} piece={piece} onMove={movePiece} />
            );
        }
    }

    return (
        <div style={{ textAlign: "center", fontFamily: "sans-serif", marginTop: "20px" }}>
            <div style={{ background: "#f0f0f0", padding: "10px", marginBottom: "15px", borderRadius: "5px", display: "inline-block", position: "relative" }}>
                <button onClick={handleLeaveRoom} style={{ marginRight: "15px", padding: "3px 8px", cursor: "pointer", background: "#e74c3c", color: "white", border: "none", borderRadius: "3px" }}>
                    🚪 Lobby
                </button>
                <span>Raum: <strong>{roomCode}</strong> | Rolle: <strong>{myRole}</strong></span>
                <div style={{ marginTop: "5px", fontWeight: "bold" }}>
                    🦆 Enten: <span style={{ color: "#bda123" }}>{entenSpieler}</span> vs. 🐌 Schnecken: <span style={{ color: "#8b5a2b" }}>{schneckenSpieler}</span>
                </div>
            </div>

            {winner ? (
                <div>
                    <h2>🎉 Team {winner} hat gewonnen! 🎉</h2>
                    <button onClick={resetGame} style={{ padding: "10px 20px", fontSize: "16px", marginBottom: "20px", cursor: "pointer" }}>
                        Neues Spiel
                    </button>
                </div>
            ) : (
                <h2 style={{ margin: "10px" }}>Am Zug: {isEntenTurn ? `Enten (${entenSpieler})` : `Schnecken (${schneckenSpieler})`}</h2>
            )}

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gridTemplateRows: "repeat(8, 1fr)",
                width: "560px",
                height: "560px",
                border: "4px solid #222",
                margin: "0 auto"
            }}>
                {squares}
            </div>
        </div>
    );
}

export default Board;