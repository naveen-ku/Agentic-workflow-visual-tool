import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import executionRoutes from "./routes/executions"

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Backend!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.use("/api/executions", executionRoutes)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
