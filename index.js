import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoClient } from 'mongodb';

// sækjum næst routerinn úr routes möppunni
import { router } from './routes/routes.js';

const app = express();
const server = createServer(app);

const io = new Server(server);

const PASSWORD = "1337"; // Lykilorð sem FASTI

let onlineUsers = [];
let db;

// nýtum okkur routerinn okkar sem við sóttum frá index.js í routes möppunni
app.use('/', router);



// Tengja URI fyrir mongodb 
const uri = 'mongodb://localhost:27017';

// Stillingar fyrir mongodb
const options = {
  useUnifiedTopology: true, // Mælt með þessu fyrir 'modern' mongodb. - ekki 100% á þessu SKOÐUM BETUR
};

// Tengjast mongodb
MongoClient.connect(uri, options)
  .then(async client => {
    console.log('Connected to MongoDB');
    // Til að geyma 'chat'
    db = client.db('chat');

    try {
      //Ná í eldri skilaboð
      io.on('connection', async (socket) => {
        console.log('User connected');
        
        // Emit Emit-a eldri skilaboðum til nýs notenda
        try {
          
          const messages = await db.collection('messages').find().toArray();
          //console.log('Previous Messages:', messages); // gera log af eldri skilaboðum
          socket.emit('previousMessages', messages);
        } catch (error) {
          console.error('Error: Næst ekki að sækja frá MongoDB:', error);
        }

       
      });
    } catch (error) {
      console.error('Error: Næst ekki að tengjast MongoDB:', error);
    }
  })
  .catch(error => {
    console.error('Error: Næst ekki að tengjast MongoDB:', error);
  });


io.on('connection', (socket) => {
  console.log('Notandi tengist');

  socket.emit('authenticate'); // Til að prompt-a notenda um password

  // Auðkenningin
  socket.on('authenticate', (password) => {
    if (password === PASSWORD) {
      console.log('Auðkenning tókst');
      socket.emit('chooseName'); 
    } else {
      console.log('Auðkenning mistókst');
      socket.disconnect(true); // Disconnect-a notenda ef auðkenni klikkar
    }
  });

  socket.on('filter', function (value) {
    console.log(value)
  })

  socket.on('chooseName', (userName) => {
    socket.userName = userName;
    onlineUsers.push(userName);
    io.emit('updateOnlineUsers', onlineUsers);
  });
//          const messages = await db.collection('messages').find({user: "David"}).toArray();
  socket.on('disconnect', () => { // Þegar notandi aftengist
    console.log('Notandi aftengdist');
    const index = onlineUsers.indexOf(socket.userName);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
    }
    io.emit('updateOnlineUsers', onlineUsers);
  });

  // Date sett við skilaboðin
  socket.on('chat message', async (msg) => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // 2-digit til að fá einungis klst og mínútur
    const dateTime = currentDate + ' ' + currentTime;
    
    // Bæta skilaboðum inn í mongodb
    try {
      await db.collection('messages').insertOne({
        user: socket.userName,
        message: msg,
        time: dateTime
      });
    } catch (error) {
      console.error('Error: Næst ekki að senda skilaboð inn í MongoDB:', error);
    }
    // Emit-a skilaboðin til notenda
    io.emit('chat message', { time: dateTime, user: socket.userName, message: msg });
  });

  socket.on("chat_update", function(msg_list) {
    io.emit("chat_download", msg_list)
  })
});

server.listen(3000, () => {
  console.log('Þjónn keyrir á: http://localhost:3000');
});
