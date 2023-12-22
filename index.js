require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // "https://assignment-11-4dcde.firebaseapp.com"
    ],
    credentials: true,
  })
);

const logger = (req, res, next) => {
  console.log("log info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access!!" });
    }

    req.user = decode;

    next();
  });
};

const uri = `mongodb+srv://${process.env.DATA_USERNAME}:${process.env.DATA_PASSWORD}@cluster0.evacz3b.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const taskCollection = client.db("ScicJobTaskDB").collection("taskCollection");

    app.post("/jwt", logger, async (req, res) => {
        try{
          const user = req.body;
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "6h"});
  
          res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'

            // secure: process.env.NODE_ENV === 'production', 
            // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          }).send({success : true});
        } catch(err) {
          console.log(err.message);
        }
    });

    app.post("/tasks", async (req, res) => {
        try {

            const taskData = req?.body;
            
            const result = await taskCollection.insertOne(taskData);
            
            res.send(result);

        } catch (err) {
            console.log(err.message);
        }
    })

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome Scic job task backend😬!!");
});

app.listen(port, () => {
  console.log("listening on port " + port);
});
