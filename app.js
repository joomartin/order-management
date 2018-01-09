const readline = require('readline-sync');
const fs = require('mz/fs');

const DB = {
    companies: require('./database/companies.json'),
    products: require('./database/products.json')
}

const ProductQuery = {
    findMoreById(ids) {
        return DB.products.filter(p => ids.some(id => id === p.id));
    }
}

const CompanyQuery = {
    findById(id) {
        return DB.companies.find(c => c.id == id);
    }
}

const IO = {
    mainMenu() {
        console.log('Válassz műveletet');
        console.log('1 - Új megrendelés');
        console.log('2 - Kimutatások');
    
        const action = readline.question();
    
        return parseInt(action);
    },
    
    inputCompany(allCompanies = false) {
        console.log('Válassz céget\r\n');
        let str = DB.companies.map(c => `${c.id} - ${c.name}`).join('\r\n');
    
        str += allCompanies ? `\r\n${DB.companies.length + 1} - Összes cég` : '';
    
        console.log(str);
    
        const action = readline.question();
        return parseInt(action);
    },
    
    inputProducts() {
        console.log('Válassz termékeket (vesszővel elválasztva lehet többet)\r\n');
        const str = DB.products.map(p => `${p.id} - ${p.name}`).join('\r\n');    
    
        console.log(str);
    
        return readline.question();
    },
    
    inputCustomer() {
        return readline.question('Megrendelő neve: ');
    }
}

function parseProductSelection(selection) {
    return selection
        .split(',')
        .filter(s => s.length !== 0)
        .map(s => parseInt(s));
}   

function createOrderData() {
    const companyId = IO.inputCompany();
    const productIds = parseProductSelection(IO.inputProducts());
    const customer = IO.inputCustomer();
    const price = ProductQuery.findMoreById(productIds).reduce((sum, p) => sum + parseInt(p.price), 0);

    return {
        company: CompanyQuery.findById(companyId),
        data: {
            productIds,
            customer,
            date: new Date,
            price
        }
    };
}

function saveOrder(orderData) {
    const filename = `./database/${orderData.company.database}`;
    const orders = require(filename);
    const newOrders = [
        ...orders,
        orderData.data
    ];

    return fs.writeFile(filename, JSON.stringify(newOrders));
}

const action = IO.mainMenu();
switch (action) {
    case 1:
        const order = createOrderData();
        saveOrder(order)
            .then(res => console.log('Mentés sikeres'))
            .catch(err => console.log('Hiba történt: ', err));

        break;
    case 2:
        throw new Error('Not implemented');
}