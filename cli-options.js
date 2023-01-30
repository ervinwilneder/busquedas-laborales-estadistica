// Dependencies
const { ArgumentParser } = require('argparse');

// Set arguments for CLI
const parser = new ArgumentParser();

parser.add_argument('--dummy', {
    help: 'Dummy argument',
    action: 'store_true'
});

parser.add_argument('--auth', {
    help: 'Retrieve cookies from browser as user is already logged in',
    action: 'store_true'
});

parser.add_argument('--keywords', {
    help: 'Keywords separated by comma (e.g. "statistics,data,data engineer,data ops"',
});

parser.add_argument('--descriptions', {
    help: 'Retrieve job searchs descriptions',
    action: 'store_true'
});

// Export parser variable
module.exports = { parser };