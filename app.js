const express = require('express');
const app = express();
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const messageRouter = require('./routes/messageRoutes');

app.use(express.json());


app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/messages', messageRouter);



module.exports = app;
