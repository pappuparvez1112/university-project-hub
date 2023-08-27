require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5500;

const cors = require("cors");

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token use
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mzmzu2p.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const db = client.db("university-project-hub");
    const projectCollection = db.collection("project");
    const userCollection = db.collection("user");
    const loginCollection = db.collection("login");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await loginCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "porbidden message" });
      }
      next();
    };

    app.get("/projects", async (req, res) => {
      const cursor = projectCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    const indexKeys = { name: 1 };
    const indexOptions = { name: "projectName" };
    const result = await projectCollection.createIndex(indexKeys, indexOptions);
    console.log(result);

    app.get("/projectNameSearch/:text", async (req, res) => {
      const text = req.params.text;
      // console.log(text)
      const result = await projectCollection
        .find({
          $or: [{ name: { $regex: text, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    app.post("/projects", verifyJWT, async (req, res) => {
      const project = req.body;

      const result = await projectCollection.insertOne(project);

      res.send(result);
    });

    app.get("/project/:id", async (req, res) => {
      const id = req.params.id;

      const result = await projectCollection.findOne({ _id: ObjectId(id) });
      console.log(result);
      res.send(result);
    });

    app.delete("/project/:id", async (req, res) => {
      const id = req.params.id;

      const result = await projectCollection.deleteOne({ _id: ObjectId(id) });
      console.log(result);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const result = await userCollection.insertOne(user);

      res.send(result);
    });

    app.post("/login", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await loginCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await loginCollection.insertOne(user);
      res.send(result);
    });
    app.get("/login/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await loginCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });
    // role
    app.patch("/login/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await loginCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/login", verifyJWT, verifyAdmin, async (req, res) => {
      const user = req.body;

      const result = await loginCollection.insertOne(user);

      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find().limit(20);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;

      const result = await userCollection.findOne({ email });

      if (result?.email) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello Programmer");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
