import express from "express";

//Import routes 
import Index from './routes/main'
import Auth from './routes/users'

const app = express();
const PORT = 8080;


app.use('/', Index)
app.use('/auth', Auth)

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});