import { envMissing } from './util.js';

// validate environment being properly configured
(!process.env.DEGIRO_USER) && envMissing('DEGIRO_USER');
(!process.env.DEGIRO_PWD) && envMissing('DEGIRO_PWD');
(!process.env.MAX_ORDER_VALUE) && envMissing('MAX_ORDER_VALUE');
(!process.env.PRODUCT_ID) && envMissing('PRODUCT_ID');

const config = {
    TRADE: process.env.TRADE == 'iaccept',
    MAX_ORDER_VALUE: parseInt(process.env.MAX_ORDER_VALUE, 10),
    PRODUCT_ID: parseInt(process.env.PRODUCT_ID, 10),
    CURRENCY: process.env.CURRENCY || 'EUR'
}

export default config;
