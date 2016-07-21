
var lastOrderNo = 0;
var size = 5;

$(document).ready(function () {
    var model = new viewModel();
    ko.applyBindings(model);

    model.tick();
});


function viewModel() {
    var self = this;
    self.lastOrderNo = 0;
    self.size = 3;

    self.ask = ko.observableArray();
    self.bid = ko.observableArray();
    self.trade = ko.observableArray();

    self.top20ask = ko.computed(function () {

        return self.ask().sort(function (left, right) {
            if (left.price == right.price) return 0;
            else if (left.price < right.price) return -1;
            else return 1;
        })
            .slice(0, 20);

    });

    self.top20bid = ko.computed(function () {

        return self.bid().sort(function (left, right) {
            if (left.price == right.price) return 0;
            else if (left.price < right.price) return 1;
            else return -1;
        })
            .slice(0, 20);
    });

    self.top30trade = ko.computed(function () {
        return self.trade().slice(-30).reverse();

    });

    self.reset = function(){
        $.get('reset',function(){

            self.lastOrderNo = 0;
            self.bid([]);
            self.ask([]);
            self.trade([]);
        });

    };

    self.tick = function () {
        setInterval(function () {
            $.get(`listOrders/${self.lastOrderNo}/${self.size}`, function (data) {

                if (data) {
                    self.lastOrderNo = data[data.length - 1].orderNo + 1;
                }

                self.processNewOrders(data);
            });
        }, 1000);
    };

    self.processNewOrders = function (orders) {
        orders.forEach(function (newOrder, index) {

            if (newOrder.side == 'bid') {
                //外盘交易

                //获取卖单列表
                var asks = self.ask().sort(function (left, right) {
                    if (left.price == right.price) return 0;
                    else if (left.price < right.price) return -1;
                    else return 1;
                });

                for (var idx = 0; idx < asks.length; idx++) {
                    askOrder = asks[idx];

                    if (newOrder.price < askOrder.price) {
                        //买方出价小于卖方最低要价，无成交
                        //self.bid.push(newOrder);
                        break;

                    } else {
                        //买方出价高于卖方最低要价，成交
                        var tradePrice = Math.floor((newOrder.price + askOrder.price) / 2);

                        if (newOrder.quantity > askOrder.quantity) {
                            //买单数量大于卖单数量
                            self.trade.push({
                                bidOrderNo: newOrder.orderNo,
                                askOrderNo: askOrder.orderNo,
                                quantity: askOrder.quantity,
                                price: tradePrice,
                                type: 'buy', //外盘
                                datetime: new Date().Format('hh:mm:ss')
                            });

                            //更新卖单
                            self.ask(asks.slice(idx + 1));

                            newOrder.quantity = newOrder.quantity - askOrder.quantity;
                            continue; //继续寻找下一个卖单

                        }
                        else if (newOrder.quantity == askOrder.quantity) {
                            //买单数量刚好等于卖单数量
                            self.trade.push({
                                bidOrderNo: newOrder.orderNo,
                                askOrderNo: askOrder.orderNo,
                                quantity: askOrder.quantity,
                                price: tradePrice,
                                type: 'buy', //外盘
                                datetime: new Date().Format('hh:mm:ss')
                            });

                            newOrder.quantity = 0;

                            //更新卖单
                            self.ask(asks.slice(idx + 1));
                            break;
                        }
                        else {
                            //买单数量小于卖单数量
                            self.trade.push({
                                bidOrderNo: newOrder.orderNo,
                                askOrderNo: askOrder.orderNo,
                                quantity: newOrder.quantity,
                                price: tradePrice,
                                type: 'buy', //外盘
                                datetime: new Date().Format('hh:mm:ss')
                            });

                            newOrder.quantity = 0;

                            //更新卖单
                            askOrder.quantity = askOrder.quantity - newOrder.quantity;
                            self.ask(asks.slice(idx));
                            break;
                        }
                    }
                }

                if (newOrder.quantity > 0) {
                    //交易结束后买单仍有剩余,部分成交或者所有买单全部被交易
                    self.bid.push(newOrder);
                }

            }
            else {
                //内盘交易

                //获取买单列表
                var bids = self.bid().sort(function (left, right) {
                    if (left.price == right.price) return 0;
                    else if (left.price < right.price) return 1;
                    else return -1;
                });

                for (var idx = 0; idx < bids.length; idx++) {
                    bidOrder = bids[idx];

                    if (newOrder.price > bidOrder.price) {
                        //卖单价格高于买单最高出价，无成交
                        // self.ask.push(newOrder);
                        break;
                    }
                    else {
                        //卖单价格低于买单最高出价，成交
                        var tradePrice = Math.floor((newOrder.price + bidOrder.price) / 2);

                        if (newOrder.quantity > bidOrder.quantity) {
                            //卖单数量高于买单数量

                            self.trade.push({
                                bidOrderNo: bidOrder.orderNo,
                                askOrderNo: newOrder.orderNo,
                                quantity: bidOrder.quantity,
                                price: tradePrice,
                                type: 'sell', //内盘
                                datetime: new Date().Format('hh:mm:ss')
                            });

                            //更新买单
                            self.bid(bids.slice(idx + 1));

                            newOrder.quantity = newOrder.quantity - bidOrder.quantity;
                            continue; //继续寻找下一个买单
                        }
                        else if (newOrder.quantity == bidOrder.quantity) {
                            //卖单数量刚好等于买单数量
                            self.trade.push({
                                bidOrderNo: bidOrder.orderNo,
                                askOrderNo: newOrder.orderNo,
                                quantity: bidOrder.quantity,
                                price: tradePrice,
                                type: 'sell', //内盘
                                datetime: new Date().Format('hh:mm:ss')
                            });
                            newOrder.quantity = 0;
                            //更新买单
                            self.bid(bids.slice(idx + 1));
                            break;

                        }
                        else {
                            //卖单数量小于买单数量
                            self.trade.push({
                                bidOrderNo: bidOrder.orderNo,
                                askOrderNo: newOrder.orderNo,
                                quantity: newOrder.quantity,
                                price: tradePrice,
                                type: 'sell', //内盘
                                datetime: new Date().Format('hh:mm:ss')
                            });
                            newOrder.quantity = 0;
                            //更新买单
                            bidOrder.quantity = bidOrder.quantity - newOrder.quantity;
                            self.bid(bids.slice(idx));
                            break;
                        }
                    }
                }

                if (newOrder.quantity > 0) {
                    //交易结束后卖单仍有剩余
                    self.ask.push(newOrder);
                }
            }
        });

    }
}


Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}