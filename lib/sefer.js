const https = require('https');
const path = require('path');
const url = require('url');
const fs = require('fs');

/********************************
 * Use:
 * URL is https://beta.hebrewbooks.org/pagefeed/hebrewbooks_org_<id>_<n>.pdf
 * where "n" is the page number
 * (eg: for "2a", `n = 1`; or for `11a`, `11a = 10.5; n = (10.5 - 1) x 2 = 19`).
 * The key "id" is the masechta's id, which can be found through digging around on the hebrew books website;
 *************************************/
/**
 * 2a => 1.5
 * 1
 */

/**
 * 
 * @param {String} urlDest - URL of document to download
 * @param {String} dest - Path in which to save document
 */

const download = (urlDest, dest) => {
  return new Promise((resolve, reject) => {
    try {
      https.get(urlDest, function(response) {

        // Handle Status Code
        if(response.statusCode >= 300 && response.statusCode < 400) {
          // 3xx
          if(!response.headers.location) {
            return reject({code: response.statusCode, msg: 'Redirected; not sure where. Sorry, Charlie.', original_msg: response.statusMessage})
          }
          if(url.parse(response.headers.location).hostname) {
            return download(response.headers.location).catch(e => {throw e})
          } else {
            return download(new url.URL(res.headers.location, url.parse(urlDest).hostname)).catch(e => {throw e});
          }
        } else if (response.statusCode === 429) {
          // 429
          let retry = new Date();
          retry.setSeconds(Number(response.headers["retry-after"]));
          return reject({code: response.statusCode, msg: `You are being rate-limited. Retry after ${retry.toLocaleTimeString()}`, original_msg: response.statusMessage });
        } else if (response.statusCode <= 100 || response.statusCode >= 400) {
          // 1xx, 4xx, 5xx
          return reject({code: response.statusCode, msg: "Something weird happened. Try accessing the following page from your browser:\n" + urlDest, original_msg: response.statusMessage});
        } else {
          var file = fs.createWriteStream(dest);
          response.pipe(file);
          file.on('finish', function() {
            file.close();
            return resolve();
          });
        }
      })
    } catch(error) {
      return reject(error);
    }
  })
}

const amudToDaf = (amud) => {
    let p = amud/2;
    return (Math.ceil(p+1)).toString() + (p.toString().split('.')[1] === '5' ? 'a': 'b')
}

const dafToAmud = (daf) => {
  let p = Number(daf.slice(0,-1)) - 1;
  
  if(daf.endsWith('a')) {
    p+= 0.5;
  } else if (daf.endsWith('b')) {
    p+=1;
  } else {
    throw "Daf must ends with 'a' or 'b'"
  }
  return (p - 1) * 2;
}

/**
 * 
 * @param {Number} page
 * @param {Number} masechtaId 
 * @param {String} dest
 */

const run = (page=1, id, dest="") => {
  if(typeof page === "string") page = dafToAmud(page);
    console.log(`  - ${id}:${amudToDaf(page)}`)
    download(
        `https://beta.hebrewbooks.org/pagefeed/hebrewbooks_org_${id}_${page}.pdf`,
        path.resolve(process.cwd(), dest, `${amudToDaf(page)}.pdf`)
    )
    .then(() => {run(page + 1, id, dest)})
    .catch(e => {
        throw JSON.stringify(e);
    });
}

module.exports = function(program) {
    program
    .command('sefer <id>')
    .description("Download seforim pages")
    .option('-S <daf>, --start <daf>', "Start where?")
    .option('-D, --dest', "Path to dest folder")
    .action(function(id, {start, dest}) {
        if(id) {
          run(start, id, dest);
        } else {
          program.help();
        }
    });
}