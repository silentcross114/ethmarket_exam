var koa= require('koa');
var app =koa();
var router = require('koa-router')();
var serve = require('koa-static');
var dataService =require('./service.js');

//serve static files
app.use(serve('./static'));

//set default page to index.html
router.redirect('/', 'index.html');

//set route of data
router.all('/listOrders/:start/:size', dataService.listOrders);
router.all('/reset', dataService.reset);

app.use(router.routes());

app.on('error', function(err,ctx){
    if (process.env.NODE_ENV != 'test') {
        console.log(err.message);
        console.log(err);
    }
});

console.log('start app server. listening on port 3000 ....');
app.listen(3000);





