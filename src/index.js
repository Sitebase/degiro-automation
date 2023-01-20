import { promises as fs } from 'fs';
import chalk from 'chalk';
import DeGiro, { DeGiroEnums, DeGiroTypes } from 'degiro-api'
const { DeGiroActions, DeGiroMarketOrderTypes, DeGiroTimeTypes } = DeGiroEnums
const { OrderType } = DeGiroTypes
import find from 'lodash.find'
import get from 'lodash.get'
import {
    envMissing,
    stockAffordable,
    fail,
    warn,
    success,
    exceptionHandler,
    getLastOrder,
    isOrderedCurrentMonth
} from './util.js';
import config from './config.js';

process.on('uncaughtException', exceptionHandler);

// login
const degiro = new DeGiro.default();
await degiro.login()

// check if we already did an order this month
const lastOrder = await getLastOrder();
const dcaBuyDone = isOrderedCurrentMonth(lastOrder);
if (dcaBuyDone)
        warn('SKIP: already bought this month so no order will be placed');

// get some essential information for calculating the order
const funds = await degiro.getCashFunds();
const wallet = get(find(funds, { currencyCode: config.CURRENCY }), 'value', 0);

// get information about the stock we want to order
// calculating on close price is not ideal but there is not
// better option at the moment to get a price indication at the current moment
// though this should not be a real issue as long as you're not buying penny stocks
const stocks = await degiro.getProductsByIds([config.PRODUCT_ID]);
const { name, productType, closePrice } = stocks[config.PRODUCT_ID];

console.log(`wallet balance (${config.CURRENCY}):`, wallet);
console.log('product name:', name);
console.log('product price:', closePrice);
console.log('max order value:', config.MAX_ORDER_VALUE);

if (closePrice > config.MAX_ORDER_VALUE)
    fail('Increase your MAX_ORDER_VALUE. The current value is too low to buy this product.');

// How many can we buy
const count = stockAffordable(config.MAX_ORDER_VALUE, closePrice);
let totalPrice = count * closePrice;

if (totalPrice > wallet)
    fail('wallet balance too low to buy', count, 'stocks with a total value of', totalPrice);

console.log('order', count, 'stocks which will cost', totalPrice);

const order = {
    buySell: DeGiroActions.BUY,
    orderType: DeGiroMarketOrderTypes.MARKET,
    productId: config.PRODUCT_ID,
    size: count,
    timeType: DeGiroTimeTypes.PERMANENT
};
const res = await degiro.createOrder(order);

const { transactionFee, confirmationId } = res;
console.log('transaction fee will be', transactionFee);

// append transaction fee to totalPrice
totalPrice += transactionFee;

// confirm transaction
let orderId = 'xxx';
if (config.TRADE) {
    orderId = await degiro.executeOrder(order, confirmationId)
    success(`Order executed with id: ${orderId}`)
} else {
    console.log(chalk.blue('DEBUG: debug mode is enable so no orders are executed. Set TRADE to disable debug mode.'));
}
await fs.appendFile('order.csv', `${new Date().toISOString()},${confirmationId},${orderId},${config.PRODUCT_ID},${name},${productType},${closePrice},${count},${transactionFee},${totalPrice},${config.CURRENCY}\n`);

