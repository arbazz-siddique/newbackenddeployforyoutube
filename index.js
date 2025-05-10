import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes
import userroutes from "./Routes/UserRoute.js";
import videoroutes from "./Routes/VideoRoute.js";
import grouproute from "./Routes/GroupRoute.js";
import commentroutes from "./Routes/CommentRoute.js";
import subscriptionRoutes from "./Routes/subscriptionRoute.js";
import otpRoutes from "./Routes/otp.js";
import locationRoute from "./Routes/location.js";

dotenv.config({ path: "./config/config.env" });

const app = express();
const server = createServer(app);

// Set trust proxy for real IP detection (important for Render)
app.set('trust proxy', true);

// Middleware
app.use(cors({
    origin:process.env.FrontendUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// Serve static files (e.g., /uploads/file.jpg)
app.use("/uploads", express.static(path.resolve("uploads")));

// Test API
app.get("/", (req, res) => {
    res.send("🚀 YourTube is working!");
});

// MongoDB connection
if (!process.env.DB_URL) {
    console.error("❌ Missing DB_URL in environment variables");
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};
connectDB();

// Setup Socket.io server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials:true,
    },
});

io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    socket.on("register_user", ({ userId }) => {
        socket.userId = userId;
        console.log(`User ${userId} registered`);
      });

    socket.on("join_group", ({ groupId, userId }) => {
    socket.join(groupId);
    console.log(`User ${userId} joined group ${groupId}`);
  });

  socket.on("leave_group", ({ groupId, userId }) => {
    socket.leave(groupId);
    console.log(`User ${userId} left group ${groupId}`);
  });
  socket.on("send_message", (msgData) => {
    io.to(msgData.groupId).emit("receive_message", {
      sender: msgData.sender,
      text: msgData.text,
      timestamp: new Date()
    });
  });
  socket.on("offer", ({ groupId, offer, to }) => {
    socket.to(groupId).emit("offer", { offer, sender: socket.userId });
  });
  socket.on("answer", ({ groupId, answer, to }) => {
    socket.to(groupId).emit("answer", { answer });
  });
  socket.on("ice_candidate", ({ groupId, candidate }) => {
    socket.to(groupId).emit("ice_candidate", { candidate });
  });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

// Routes
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/comment", commentroutes);
app.use("/group", grouproute);
app.use("/subscription", subscriptionRoutes);
app.use("/otp", otpRoutes);
app.use("/location", locationRoute);

// Server Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
