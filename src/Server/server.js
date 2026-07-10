const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 1. ZUERST den HTTP-Server erstellen
const server = http.createServer(app);

// 2. DANACH Socket.io mit dem Server verknüpfen (CORS auf "*" für GitHub/Render)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Pfad zur Leaderboard-Datei
const leaderboardPath = path.join(__dirname, "leaderboard.json");

function loadLeaderboard() {
    if (fs.existsSync(leaderboardPath)) {
        try {
            const data = fs.readFileSync(leaderboardPath, "utf8");
            return JSON.parse(data);
        } catch (e) {
            console.error("Fehler beim Lesen der Leaderboard-Datei:", e);
            return {};
        }
    }
    return {};
}

function saveLeaderboard(leaderboard) {
    try {
        fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2), "utf8");
    } catch (e) {
        console.error("Fehler beim Schreiben der Leaderboard-Datei:", e);
    }
}

function getTop5Leaderboard() {
    const leaderboard = loadLeaderboard();
    return Object.keys(leaderboard)
        .map(name => ({ name, wins: leaderboard[name] }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 5);
}

const START_BOARD = [
    ["S_Turm", "S_Springer", "S_Laeufer", "S_Dame", "S_Koenig", "S_Laeufer", "S_Springer", "S_Turm"],
    ["S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer", "S_Bauer"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer", "E_Bauer"],
    ["E_Turm", "E_Springer", "E_Laeufer", "E_Dame", "E_Koenig", "E_Laeufer", "E_Springer", "E_Turm"]
];

let games = {};

function getRoomList() {
    return Object.keys(games).map(code => {
        const playerDetails = Object.values(games[code].players);
        return {
            code,
            playerCount: playerDetails.length,
            entenName: playerDetails.find(p => p.role === "Enten")?.name || "Wartet...",
            schneckenName: playerDetails.find(p => p.role === "Schnecken")?.name || "Wartet..."
        };
    });
}

function broadcastRoomList() {
    io.to("lobby").emit("roomListUpdate", getRoomList());
}

app.post("/api/reset", (req, res) => {
    const { roomCode } = req.body;
    if (games[roomCode]) {
        games[roomCode].gameState = { board: START_BOARD, isEntenTurn: true, winner: null };
        io.to(roomCode).emit("gameStateUpdate", games[roomCode].gameState);
        return res.json({ message: "Spiel zurückgesetzt" });
    }
    res.status(404).json({ error: "Raum nicht gefunden" });
});

io.on("connection", (socket) => {
    console.log(`Client verbunden: ${socket.id}`);
    socket.join("lobby");
    let currentRoom = null;

    socket.emit("roomListUpdate", getRoomList());
    socket.emit("leaderboardUpdate", getTop5Leaderboard());

    socket.on("requestRefresh", () => {
        socket.emit("roomListUpdate", getRoomList());
        socket.emit("leaderboardUpdate", getTop5Leaderboard());
    });

    socket.on("joinRoom", ({ roomCode, playerName }) => {
        socket.leave("lobby");
        currentRoom = roomCode;
        socket.join(roomCode);

        if (!games[roomCode]) {
            games[roomCode] = {
                gameState: { board: START_BOARD, isEntenTurn: true, winner: null },
                players: {}
            };
        }

        const roomPlayers = games[roomCode].players;
        const activeRoles = Object.values(roomPlayers).map(p => p.role);
        let role = "Zuschauer";

        if (!activeRoles.includes("Enten")) {
            role = "Enten";
        } else if (!activeRoles.includes("Schnecken")) {
            role = "Schnecken";
        }

        roomPlayers[socket.id] = { role, name: playerName };

        socket.emit("init", { role, gameState: games[roomCode].gameState });
        io.to(roomCode).emit("playersUpdate", Object.values(roomPlayers));
        broadcastRoomList();
    });

    socket.on("makeMove", ({ roomCode, newGameState }) => {
        const game = games[roomCode];
        if (!game) return;

        const playerInfo = game.players[socket.id];
        if (!playerInfo) return;

        const isEntenTurn = game.gameState.isEntenTurn;

        if ((isEntenTurn && playerInfo.role === "Enten") || (!isEntenTurn && playerInfo.role === "Schnecken")) {

            if (newGameState.winner && !game.gameState.winner) {
                const winnerRole = newGameState.winner;
                const winningPlayer = Object.values(game.players).find(p => p.role === winnerRole);

                if (winningPlayer && winningPlayer.name) {
                    const leaderboard = loadLeaderboard();
                    leaderboard[winningPlayer.name] = (leaderboard[winningPlayer.name] || 0) + 1;
                    saveLeaderboard(leaderboard);
                    io.emit("leaderboardUpdate", getTop5Leaderboard());
                }
            }

            game.gameState = newGameState;
            io.to(roomCode).emit("gameStateUpdate", game.gameState);
        }
    });

    const leaveRoom = () => {
        if (currentRoom && games[currentRoom]) {
            delete games[currentRoom].players[socket.id];

            if (Object.keys(games[currentRoom].players).length === 0) {
                delete games[currentRoom];
            } else {
                io.to(currentRoom).emit("playersUpdate", Object.values(games[currentRoom].players));
            }
            broadcastRoomList();
        }
    };

    socket.on("leaveRoom", () => {
        leaveRoom();
        currentRoom = null;
        socket.join("lobby");
        socket.emit("roomListUpdate", getRoomList());
    });

    socket.on("disconnect", () => {
        leaveRoom();
    });
});

// Dynamischer Port für Render/Railway (bzw. 5001 lokal)
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));