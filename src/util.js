import { promises as fs } from 'fs';
import chalk from 'chalk';
import get from 'lodash.get'

export
function fail(...msg) {
    console.log(chalk.red('ERROR:', ...msg));
    process.exit(1);
}

export
function warn(...msg) {
    console.log(chalk.yellow(...msg));
    process.exit();
}

export
function success(...msg) {
    console.log(chalk.green(...msg));
    // process.exit();
}

export
function envMissing(name) {
    fail(`${name} environment variable is not configured.\nGo to Settings > Secrets > Actions > New repository secret to add this variable to your environment`);
}

export
function exceptionHandler(err) {
    let error = err;

    // errors from degiro api are arrays so handle these gracefully
    if (Array.isArray(err))
        error = get(err, '[0].text');

    fail(error);
}

export
function stockAffordable(spend, stockPrice, transactionFeePercentage = 0.01) {
    const correctedSpend = spend * (1 - transactionFeePercentage);
    return Math.floor(correctedSpend / stockPrice);
}

export
async function getLastOrder() {
    const orderLog = await fs.readFile('./order.csv', { flag: 'a+' });
    const orderHistory = (orderLog.toString() || '').trim().split("\n").reverse();
    const lastOrder = parseOrderLogLine(orderHistory[0]);

    return lastOrder;
}

export
function isOrderedCurrentMonth(order) {
    if (!order)
        return null;

    const date = new Date(), y = date.getFullYear(), m = date.getMonth();
    const firstDay = new Date(y, m, 1);

    return order.date > firstDay;
}

export
function parseOrderLogLine(line) {
    if (!line)
        return null;

    const [ date, orderId ] = line.split(',');
    return { date: new Date(date), orderId };
}
