const google = require('googlethis');
async function run() {
  const options = {
    page: 0, 
    safe: false, 
    parse_ads: false, 
    additional_params: {
      hl: 'en'
    }
  };
  
  const response = await google.search('youth opportunities kurdistan', options);
  if(response.results.length > 0) {
     console.log(response.results[0].title);
     console.log(response.results[0].description);
     console.log(response.results[0].url);
  }
}
run();
