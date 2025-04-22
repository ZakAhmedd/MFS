const express = require('express');
const app = express();
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const messageRouter = require('./routes/messageRoutes');
const fightRouter = require('./routes/fightRoutes')

app.use(express.json());


app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/messages', messageRouter);
app.use('/api/fights', fightRouter);




module.exports = app;
