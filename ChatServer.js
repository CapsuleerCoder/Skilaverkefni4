const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
// sækjum mongodb gagnagrunninn
const mongo = require('mongodb').MongoClient;

app.get('/', function(req, res){
	res.sendFile(__dirname+'/ChatServer.html');
});

// skrifum aðra leið fyrir routerinn
app.get('/*', function(req, res){
	res.write('Adgangur oheimill!');
	res.end();
});

let url = 'mongodb://127.0.0.1/chatserver2023_taka2';

// tengjumst gagnagrunninum og náum í safnið mongodb_Synidaemi 
// en þar munum við geyma skjölin okkar
mongo.connect(url, {useUnifiedTopology: true}, function(err, db) {
	if (err) {
		throw err;
	}
	var chatdb = db.db("chatserver2023_taka2");
	// hlustum eftir connection atburð á servernum og
	// skrifum svarfall fyrir þann atburð
	io.on('connection', function(socket){
		console.log('a new user has connected');

		socket.on('disconnect', function(){
			console.log('user disconnected');
		});

		socket.on('join', (username) => {
			if (!username) {
				socket.userName = 'anonymous';
			} else {
				socket.userName = username;
			}			

			

		});

		socket.on('chatmsg', function(msg){
			// geymum skilaboðin í safninu okkar
			chatdb.collection("messages").insertOne({user: socket.userName, message: msg});
			// síðan sendum við skilaboðin til allra biðlaranna/clientanna
			io.emit('chatmsg', socket.userName, msg);
		});
	});
});

server.listen(3000, function(){
	console.log('Server is listening on port 3000');
})

