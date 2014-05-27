//general algorithm
//1) Check if, with both commission AND withdrawl fees we have an opportunity for arbitrage
//)Determine the highest amount that both exchanges can cover at price
//2) Check if there's an available balance on both exchanges.  BTC will be slowest
//3) If we do, sell on the higher, buy on the lower
//3) Transfer LTC to the seller exchange, and BTC to the buyer exchange to prepare to do it again.  We'll need
//payment addresses setup for this
//4) Scan our email so we can check for confirmation emails


var http = require('http');

//run the amount
var amountInLTC = 100;

var cryptsyLTCWallet = 'LYNQnqG4gzXVmocAV5uDwJwuU4VLTQ8u8g';
var cryptsyBTCWallet = '13nMeXQwMwLNuizSKuYCiGzMePTQbQPGU6';

var btceLTCWallet = 'LQgwFxJjmKSstAnzPaXKojeVGop8ayGHfn';
var btceBTCWallet = '1J3ocPwKFJmXmxt3b7Cw9YD7uK37S7ZQXy';
if(process.argv.length > 2)
{
    amountInLTC = process.argv[2];
}


    console.log('Running program . . . ');
    loadAllExchanges(http, function(exchanges){
        var opps = findBestArbitrageOpp(amountInLTC, exchanges);
        if(opps.length > 0)
        {
            //find the best
            var best = opps[0];
            for(var i=0;i<opps.length;i++)
            {
                if(opps[i].TotalProfit > best.TotalProfit)
                {
                    best = opps[i];
                }
            }

            console.log(best.display + " for a profit of " + best.TotalProfit + " LTC");

            //figure out how many BTC we should buy
            var amtBTC = amountInLTC * best.buyPrice;
            //start doing our trades
            if(best.buyFrom === 'btc-e')
            {
                //TODO these in parallel
                sellLTCForBTCOnCryptsy(amountInLTC, best.sellPrice);
                buyLTCWithBTCOnBTCE(amtBTC, best.buyPrice);

                TransferLTCFromBTCEToCryptsy(amountInLTC);
                TransferBTCFromCryptsyToBTCe(amtBTC);
            }
            else
            {
               //TODO these in parallel
               buyLTCWithBTCOnCryptsy(amtBTC, best.buyPrice);
               sellLTCForBTCOnBTCE(amountInLTC, best.sellPrice);

               TransferLTCFromCryptsyToBTCE(amtBTC);
               TransferLTCFromBTCEToCryptsy(amountInLTC);
            }

            //once the trades are settled, we want to move the funds from one exchange to the other

            //we'll then need to check email to click the confirm
        }
        else
        {
            console.log("No arbitrage opportunities exist")
        }
    });


function TransferLTCFromCryptsyToBTCE(amountLTC){
         //withdraw from cryptsy to the BTCE ltc wallet
}

function TransferLTCFromBTCEToCryptsy(amountLTC){

}

function TransferBTCFromBTCEToCryptsy(amountBTC){

}

function TransferBTCFromCryptsyToBTCe(amountBTC){

}

//on our BTC account, go LTC->BTC
function sellLTCForBTCOnBTCE(amountLTC, priceLTC)
{

}

//on our BTC account, go BTC->LTC
function buyLTCWithBTCOnBTCE(amountBTC, priceLTC)
{

}

//on our cryptsy account, go LTC->BTC
function sellLTCForBTCOnCryptsy(amountLTC, priceLTC)
{

}

//on our cryptsy account, go BTC->LTC
function buyLTCWithBTCOnCryptsy(amountBTC, priceLTC)
{

}

//represents possible arbitrage between two exchanges
//SellFrom means sell BTC to USD, buyFrom means buy BTC with USD
function arbitrageOpp(sellFrom, buyFrom)
{
      this.buyPrice = buyFrom.lastPrice;
      this.sellPrice = sellFrom.lastPrice;
      this.buyWithdrawlFeeLTC = buyFrom.withdrawlFeeLTC;
      this.sellWithdrawlFeeBTC = buyFrom.withdrawlFeeBTC;
      this.commission = sellFrom.sellCommission + buyFrom.buyCommission;

      this.buyFrom = buyFrom.name;
      this.display = 'Sell to ' + sellFrom.name + " and buy from " + buyFrom.name;
}

//get all exchanges we know about
function loadAllExchanges(http, afterLoad){

        var exchanges = [];

    function getBTCEData() {
        var https = require('https');
        var options = {

            host: 'btc-e.com',
            path: '/api/2/ltc_btc/ticker'
        };

        var req = https.request(options, function (res) {
            console.log('Recieved btc-e update');
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                debugger;

                var item = JSON.parse(chunk);
                console.log('BTC last price:' + item.ticker.last);
                exchanges.push({
                    name: 'btc-e',
                    lastPrice: item.ticker.last,
                    buyCommission: .002,
                    sellCommission: .002,
                    withdrawlFeeBTC: 0.001,
                    withdrawlFeeLTC: .01
                });

                afterLoad(exchanges);
            });
        });

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });
        req.end();
    }

    http.get('http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=3', function(res){
             debugger;
            console.log('Made cryptsy request');
            //translate the cryptsy data
            //TODO check this is ltcbtc
            res.on('data', function(chunk){
                debugger;
                //just find the one value we need here
                var start = chunk.toString().indexOf('"lasttradeprice":"');
                if(start > -1)
                {
                    var realStart = start + 17;
                    var end = chunk.toString().indexOf('",', realStart);
                    var lastPrice = chunk.toString().substr(realStart + 1, end - (realStart+1));
                    console.log('found cryptsy price of ' + lastPrice);
                    exchanges.push(
                        {
                            name:'cryptsy',
                            lastPrice : lastPrice,
                            sellCommission :.002,
                            buyCommission :.003,
                            withdrawlFeeLTC :.004,
                            withdrawlFeeBTC :0.00050000
                        }
                    );
                    //get btc-e now
                    getBTCEData();
                }
            });
    });
}

function findBestArbitrageOpp(amount, exchanges)
{
    var possibleExchanges = [];
    for(var i = 0; i< exchanges.length; i++)
    {
        var seller = exchanges[i];
        //cycle through all the others
        for(var o = 0;o< exchanges.length;o++)
        {
             if(i != o)
             {
                 var exchangeOpp = new arbitrageOpp(seller, exchanges[o]);

                 //does our item clear zero?
                 var amountMadePerBTC = exchangeOpp.sellPrice - exchangeOpp.buyPrice;
                 if(amountMadePerBTC > 0)
                 {
                     //does it clear the commission?
                     var profitAmountRatio = (amountMadePerBTC)/exchangeOpp.sellPrice;

                     if(exchangeOpp.commission < profitAmountRatio)
                     {
                         exchangeOpp.TotalProfit = (profitAmountRatio - exchangeOpp.commission) * amount;

                         //get the total cost of withdrawls in LTC
                         var withdrawlCost = exchangeOpp.buyWithdrawlFeeLTC + (exchangeOpp.sellWithdrawlFeeBTC/exchangeOpp.sellPrice);
                         console.log("Withdrawl will cost " + withdrawlCost + " LTC");
                         if(exchangeOpp.TotalProfit > withdrawlCost)
                         {
                            possibleExchanges.push(exchangeOpp);
                         }
                         else
                         {
                             console.log("Profit exists, but not enough capitol for withdrawls to work");
                         }
                     }
                 }
             }
        }
    }

    return possibleExchanges;