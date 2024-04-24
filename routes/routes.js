import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
export const router = 	express();

const __dirname = dirname(fileURLToPath(import.meta.url));

// skrifum leið/rútu fyrir routerinn okkar
router.get('/', function(req, res){
	res.sendFile(join(__dirname, '../index.html'));
});

router.get('/index.css', function(req, res){
	res.sendFile(join(__dirname, '../index.css'));
});

// skrifum aðra leið fyrir routerinn
router.get('/*', function(req, res){
	res.write('Adgangur oheimill!');
	res.end();
});

// flytjum routerinn út
//export default router;


