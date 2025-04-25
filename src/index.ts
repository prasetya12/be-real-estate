import express from 'express';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { propertiesRouter } from './routes/properties';
dotenv.config();

const app = express();
app.use(express.json());
app.use('/',authRouter);
app.use('/properties',propertiesRouter);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});