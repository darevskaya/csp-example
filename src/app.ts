import express from 'express';
import path from 'path';
import indexRouter from './routes/index';
import examplesRouter from './routes/examples/index';

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/', indexRouter);
app.use('/examples', examplesRouter);

export default app;
