// Dependencies
const puppeteer = require('puppeteer-core');
const fs = require('fs');

// Custom modules
const config = require('./config');
const tools = require('./tools');
const { parser } = require('./cli-options');

// CLI arguments
const args = parser.parse_args();

// Init empty variables
const jobs = new Array();

// Main proccess
(async () => {

    try {

        if (args.auth) {
            // Launch browser and get opened tab
            const browser = await puppeteer.launch(config.PUPPETEER_OPTIONS_WINDOWS_AUTH);
            const [page] = await browser.pages();

            // Go to home page
            await page.goto(config.URL, {'waitUntil' : 'networkidle2'});

            // Save cookies
            let cookies = await page.cookies();
            let cookieJson = JSON.stringify(cookies);
            if (!fs.existsSync('auth')) { fs.mkdirSync('auth') };
            fs.writeFileSync('auth\\cookies.json', cookieJson);

            // Finally close browser
            await browser.close();
            process.exit();
        }
        
        // Launch browser and get opened tab
        const browser = await puppeteer.launch(config.PUPPETEER_OPTIONS);
        const [page] = await browser.pages();
        
        // Set some browser & navigation features
        await page.setViewport({ width: 1440, height: 1080 });
        await page.setDefaultNavigationTimeout(60000);

        // Handle cookies
        if (fs.existsSync('auth/cookies.json')) {
            let cookies = fs.readFileSync('auth/cookies.json', 'utf8');
            let deserializedCookies = JSON.parse(cookies);
            await page.setCookie(...deserializedCookies);
        };

        // Go to home page
        await page.goto(config.URL, {'waitUntil' : 'networkidle2'});

        // Just an screenshot for debugging purpose
        if (!fs.existsSync('screenshots')) { fs.mkdirSync('screenshots') };
        await page.screenshot({ path: `screenshots/linkedin.jpeg` });

        // Handle login page
        let isFeed = await page.evaluate(() => {
            return document.location.href.includes('feed')
        });
        
        if (!isFeed) {
            await page.click('.sign-in-form__submit-button');
            await tools.delay(6000);
            
            // Save cookies
            let cookies = await page.cookies();
            let cookieJson = JSON.stringify(cookies);
            if (!fs.existsSync('auth')) { fs.mkdirSync('auth') };
            fs.writeFileSync('auth/cookies.json', cookieJson);
        };

        // Handle arguments
        let keywords = args.keywords.split(',');
        let today = new Date().toLocaleDateString();

        // Retrieve job searchs by keywords
        for (let k of keywords) {

            // Go to LinkedIn job search page
            await page.goto(`https://www.linkedin.com/jobs/search/?keywords=${k}&location=Argentina&f_TPR=r604800&f_E=2`, {"waitUntil" : "networkidle2"});

            // Handle pagination
            let numberOfPages = await page.evaluate(() => {
                return document.querySelector('.artdeco-pagination__pages') == null ? 1 : document.querySelector('.artdeco-pagination__pages').children.length;
            });

            let starts = [...Array(numberOfPages).keys()].map(x => x * 25);
            
            // Iterate over job pages
            for (s of starts) {
                
                // Go to LinkedIn job search page
                await page.goto(`https://www.linkedin.com/jobs/search/?keywords=${k}&location=Argentina&f_TPR=r604800&f_E=2&start=${s}`, {"waitUntil" : "networkidle2"});

                // Scroll page down to get all results
                await page.evaluate(() => {
                    setInterval(function() { 
                        document.querySelector('.jobs-search-results-list').scrollTo({ left: 0, top: document.querySelector('.jobs-search-results-list').scrollHeight, behavior: "smooth" });
                    }, 500);
                });

                // Wait to reach bottom page
                await tools.delay(10000);

                // Save all job searchs
                await page.evaluate(() => {
                    jobs = []

                    document.querySelectorAll('ul.scaffold-layout__list-container li.jobs-search-results__list-item').forEach(e => jobs.push({
                        'rol':e.innerText.split('\n')[0], 
                        'empresa': e.innerText.split('\n')[1],
                        'info':e.innerText.split('\n').slice(2), 
                        'link':e.querySelector('a').href}));

                    return jobs;
                })
                .then(data => { 
                    if (k != 'try') {
                        jobs.push({
                            'keyword': k,
                            'jobSearchs': data,
                            'date': today
                        });
                    };
                });
            };
        }; 

        // Save response
        if (!fs.existsSync('downloads')) { fs.mkdirSync('downloads') };
        fs.writeFileSync(`downloads/response.json`, JSON.stringify(jobs), function (err) { if (err) throw err });

        // Finally close browser
        await tools.delay(5000);
        await browser.close();

    } catch (err) {
        console.error(err);

        // If something goes wrong, close browser
        if (browser) {
            await browser.close();
        };
    };
})()