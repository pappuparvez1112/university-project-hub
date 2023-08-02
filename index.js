require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5500;

const cors = require("cors");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://university-project-hub:universityprojecthub1218@cluster0.mzmzu2p.mongodb.net/?retryWrites=true&w=majority`;
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

    app.get("/projects", async (req, res) => {
      const cursor = projectCollection.find({});
      const project = await cursor.toArray();

      res.send({ status: true, data: project });
    });

    app.post("/projects", async (req, res) => {
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

      const result = await productCollection.deleteOne({ _id: ObjectId(id) });
      console.log(result);
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const user = req.body;

      const result = await userCollection.insertOne(user);

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
