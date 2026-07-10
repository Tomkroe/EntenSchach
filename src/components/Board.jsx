import { useState, useEffect } from "react";
import { Peer } from "peerjs";
import Square from "./Square";
import {
    validateBauer,
    validateTurm,
    validateLaeufer,
    validateSpringer,
    validateDame,
    validateKoenig
} from "./figures";

export default function Board() {
    // PeerJS States
    const [peer, setPeer] = useState(null);
    const [myPeerId, setMyPeerId] = useState("");
    const [targetPeerId, setTargetPeerId] = useState("");
    const [conn, setConn] = useState(null);

    // Spiel-States
    const [board, setBoard] = useState([
        ["S_Turm", "S_Springer", "S_Laeufer", "S_Dame", "S_Koenig", "S_Laeufer", "S_Springer", "S_Turm"],
        ["S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer"],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ["E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer"],
        ["E_Turm", "E_Springer", "E_Laeufer", "E_Dame", "E_Koenig", "E_Laeufer", "E_Springer", "E_Turm"]
    ]);
    const [isEntenTurn, setIsEntenTurn] = useState(true);
    const [winner, setWinner] = useState(null);
    const [myRole, setMyRole] = useState("Enten"); // Der Ersteller startet standardmäßig als Enten

    // 1. PeerJS beim Start initialisieren
    useEffect(() => {
        const newPeer = new Peer(undefined, {
            host: "0.peerjs.com",
            port: 443,
            secure: true
        });

        newPeer.on("open", (id) => {
            setMyPeerId(id);
        });

        newPeer.on("error", (err) => {
            console.error("PeerJS Fehler:", err);
        });

        // Wenn ein Partner sich mit uns verbindet (Wir sind Host -> Enten, er wird Schnecken)
        newPeer.on("connection", (connection) => {
            setConn(connection);
            setMyRole("Enten");
            setupConnectionListeners(connection);
        });

        setPeer(newPeer);
        return () => {
            if (newPeer) newPeer.destroy();
        };
    }, []);

    // 2. Event-Listener für empfangene Daten (Züge des Gegners)
    const setupConnectionListeners = (connection) => {
        connection.on("data", (data) => {
            if (data.type === "MOVE") {
                setBoard(data.board);
                setIsEntenTurn(data.isEntenTurn);
                setWinner(data.winner);
            } else if (data.type === "RESET") {
                resetLocalGame();
            }
        });
    };

    // 3. Verbindung zum Ersteller aufbauen (Wir treten bei -> werden Schnecken)
    const connectToFriend = () => {
        if (!targetPeerId || !peer) return;
        const connection = peer.connect(targetPeerId);
        setConn(connection);
        setMyRole("Schnecken"); // Wer beitritt, spielt die Schnecken
        setupConnectionListeners(connection);
    };

    // 4. Spiellogik und Senden des Zuges
    const movePiece = (fromRow, fromCol, toRow, toCol) => {
        if (winner || board.length === 0) return;

        // Prüfen, ob man überhaupt am Zug ist
        if (isEntenTurn && myRole !== "Enten") return;
        if (!isEntenTurn && myRole !== "Schnecken") return;

        const movingPiece = board[fromRow][fromCol];
        const targetPiece = board[toRow][toCol];

        if (!movingPiece) return;

        // Eigene Figuren validieren
        if (movingPiece.startsWith("E_") && !isEntenTurn) return;
        if (movingPiece.startsWith("S_") && isEntenTurn) return;

        // Nicht die eigenen Figuren schlagen
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

        // Lokalen Zustand aktualisieren
        setBoard(newBoard);
        setIsEntenTurn(nextTurn);
        setWinner(localWinner);

        // Zug an den Mitspieler senden
        if (conn) {
            conn.send({
                type: "MOVE",
                board: newBoard,
                isEntenTurn: nextTurn,
                winner: localWinner
            });
        }
    };

    const resetLocalGame = () => {
        setBoard([
            ["S_Turm", "S_Springer", "S_Laeufer", "S_Dame", "S_Koenig", "S_Laeufer", "S_Springer", "S_Turm"],
            ["S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer"],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ["E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer"],
            ["E_Turm", "E_Springer", "E_Laeufer", "E_Dame", "E_Koenig", "E_Laeufer", "E_Springer", "E_Turm"]
        ]);
        setIsEntenTurn(true);
        setWinner(null);
    };

    const resetGame = () => {
        resetLocalGame();
        if (conn) {
            conn.send({ type: "RESET" });
        }
    };

    // --- Ansicht ---
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
            <h2>🦆 Enten gegen Schnecken 🐌 (Peer-to-Peer)</h2>

            <div style={{ background: "#f0f0f0", padding: "15px", marginBottom: "15px", borderRadius: "5px", display: "inline-block" }}>
                <p style={{ margin: "0 0 10px 0" }}>Deine ID: <b style={{ color: "green", userSelect: "all" }}>{myPeerId || "Generiere ID..."}</b></p>

                <input
                    type="text"
                    placeholder="ID des Freundes einfügen"
                    value={targetPeerId}
                    onChange={(e) => setTargetPeerId(e.target.value)}
                    style={{ padding: "5px", marginRight: "10px", width: "250px" }}
                />
                <button onClick={connectToFriend} style={{ padding: "5px 10px", cursor: "pointer" }}>
                    Verbinden
                </button>

                <div style={{ marginTop: "10px", fontWeight: "bold" }}>
                    {conn ? <span style={{ color: "green" }}>⚡ Verbunden! Deine Rolle: {myRole}</span> : <span style={{ color: "orange" }}>Warte auf Verbindung...</span>}
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
                <h2 style={{ margin: "10px" }}>Am Zug: {isEntenTurn ? "Enten 🦆" : "Schnecken 🐌"}</h2>
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