module.exports = {
    listOrders,
    reset

}

var maxOrderNo = 0;
var orders = [];


//generate orders
var timer = null;

function generateData() {

    if (!timer) {
        timer = setInterval(function () {

            if (orders.length > 99999) {
                clearInterval(timer);
                timer = null;
            }

            orders.push({
                orderNo: maxOrderNo++,
                side: Math.random() < .5 ? 'ask' : 'bid',
                quantity: Math.floor(Math.random() * 16),
                price: 50 + Math.floor(Math.random() * 180)
            });

        }, 1000);
    }
}


function* listOrders(next) {

    var start = parseInt(this.params.start);
    var size = parseInt(this.params.size);

    if (start >= orders.length) return null;

    if (start + size >= orders.length) {
        this.body = orders.slice(start);
    }
    else {
        this.body = orders.slice(start, start + size);
    }
}


function* reset(next) {

    orders = [];
    maxOrderNo = 0;
    generateData();

    this.body = '';

}

generateData();