const readline = require('readline-sync');
const fs = require('mz/fs');

const DB = (() => {
    const COMPANIES = require('./database/companies.json');
    const PRODUCTS = require('./database/products.json');

    return {
        companies: {
            findAll() {
                return COMPANIES;
            },
            findById(id) {
                return COMPANIES.find(c => c.id == id);
            },
            findOrders(company) {
                return require(`./database/${company.database}`);
            }
        },
        products: {
            findAll() {
                return PRODUCTS;
            },
            findMoreById(ids) {
                return PRODUCTS.filter(p => ids.some(id => id === p.id));
            }
        },
        orders: {
            saveOrder({ company, order }) {
                const orders = DB.companies.findOrders(company);
                const newOrders = [
                    ...orders,
                    order
                ];
            
                return fs.writeFile(`./database/${company.database}`, JSON.stringify(newOrders));
            }
        }
    };
})();

const IO = {
    mainMenu() {
        console.log('Válassz műveletet');
        console.log('1 - Új megrendelés');
        console.log('2 - Kimutatások');
    
        const action = readline.question();
        return parseInt(action);
    },

    reportMenu() {
        console.log('Válassz kategóriát');
        console.log('1 - Forgalom lekérdezése');
        console.log('2 - Termékek fogyása');

        const action = readline.question();
        return parseInt(action);
    },
    
    inputCompany(allCompanies = false) {
        console.log('Válassz céget\r\n');
        const companies = DB.companies.findAll();
        let str = companies.map(c => `${c.id} - ${c.name}`).join('\r\n');
    
        str = allCompanies ? `${0} - Összes cég\r\n` + str : str;
    
        console.log(str);
    
        const action = readline.question();
        return parseInt(action);
    },
    
    inputProducts() {
        console.log('Válassz termékeket (vesszővel elválasztva lehet többet)\r\n');
        const str = DB.products.findAll().map(p => `${p.id} - ${p.name}`).join('\r\n');    
    
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
    const price = DB.products.findMoreById(productIds).reduce((sum, p) => sum + parseInt(p.price), 0);

    return {
        company: DB.companies.findById(companyId),
        order: {
            productIds,
            customer,
            date: new Date,
            price
        }
    };
}

function getRevenue(companyId) {
    if (companyId === 0) {
        return getAllCompanyRevenue();
    } else {
        return getCompanyRevenue(companyId);
    }
}

function getAllCompanyRevenue() {
    const companies = DB.companies.findAll();
    return companies
        .map(c => DB.companies.findOrders(c))
        .reduce((acc, curr) => acc.concat(curr), [])
        .reduce((sum, o) => sum + parseInt(o.price), 0);
}

function getCompanyRevenue(companyId) {
    const company = DB.companies.findById(companyId);
    const orders = DB.companies.findOrders(company);

    return orders.reduce((sum, o) => sum + parseInt(o.price), 0);
}

const action = IO.mainMenu();
switch (action) {
    case 1:
        const order = createOrderData();
        DB.orders.saveOrder(order)
            .then(res => console.log('Mentés sikeres'))
            .catch(err => console.log('Hiba történt: ', err));

        break;
    case 2:
        IO.reportMenu();
        const companyId = IO.inputCompany(true);
        const revenue = getRevenue(companyId);

        console.log('Forgalom: ' + revenue + ' Ft');
}