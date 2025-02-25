const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocket = require("ws");
const parser = require('body-parser');

const app1 = express();
app1.use(express.json({ limit: "50mb" }));
app1.use(express.urlencoded({ limit: "50mb", extended: true }));
app1.use(parser.json());
app1.use(cors());

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });
const clients = {};  // Stores clients by their unique ID

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.isAlive = true; // Mark client as alive
    ws.on("pong", () => {
       
        ws.isAlive = true; // Reset on pong response
    });

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "register") {
            clients[data.id] = ws;
            console.log(`Client registered with ID: ${data.id}`);
        }

        if (data.type === "message") {
            const targetClient = clients[data.targetId];
            if (targetClient && targetClient.readyState === WebSocket.OPEN) {
                targetClient.send(JSON.stringify({ message: data.message }));
                console.log(`Message sent to client ${data.targetId}: ${data.message}`);
            } else {
                console.log(`Client ${data.targetId} not found or disconnected`);
            }
        }
    });

    ws.on("close", () => {
        for (let id in clients) {
            if (clients[id] === ws) {
                console.log(`Client ${id} disconnected`);
                delete clients[id];
                break;
            }
        }
    });
});

// Ping-Pong Mechanism to check connection
setInterval(() => {
    for (let id in clients) {
        const ws = clients[id];
        if (ws.isAlive === false) {
            console.log(ws.isAlive)
            console.log(`Client ${id} unresponsive, removing.`);
            ws.terminate(); // Forcefully close the connection
            delete clients[id];
        } else {
            ws.isAlive = false;
            ws.ping(); // Send ping
           
        }
    }
}, 5000); // Check every 5 seconds

console.log("WebSocket server running on ws://localhost:8080");

// Express Routes


app1.get("/board1", async (req, res) => {
    const messageData = {
        type: "message",
        targetId: "client123",
        message: 1
    };

    if (clients["client123"] && clients["client123"].readyState === WebSocket.OPEN) {
        clients["client123"].send(JSON.stringify(messageData));
        console.log("Message sent to client123");
    } else {
        console.log("Client123 is not connected");
    }

    return res.json(1);
});
app1.get("/board2", async (req, res) => {
    const messageData = {
        type: "message",
        targetId: "client123",
        message: 2
    };

    if (clients["client123"] && clients["client123"].readyState === WebSocket.OPEN) {
        clients["client123"].send(JSON.stringify(messageData));
        console.log("Message sent to client123");
    } else {
        console.log("Client123 is not connected");
    }

    return res.json(1);
});
app1.post("/board", async (req, res) => {
    const messageData = req.body 
    console.log(messageData)  
    if (clients["client123"] && clients["client123"].readyState === WebSocket.OPEN) {
        clients["client123"].send(JSON.stringify(messageData));
        console.log("Message sent to client123");
        return res.json({"code":1})
    } else {
        console.log("client123 disconnected");
        return res.json({"code":0})
    }
});
app1.listen(5000, () => console.log("Route server running at 5000"));
