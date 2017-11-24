const fs = require('fs');
const path = require('path');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_DIR = path.join('.', '.credentialsCache');

const TOKEN_PATH = path.join(TOKEN_DIR, 'googleCal.json');

let authToken;

// Load client secrets from a local file.
fs.readFile('./client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    authorize(JSON.parse(content), auth => {
        authToken = auth;
        //listCalendars();
    });
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const auth = new googleAuth();
    const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }

    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(calendarId, timeMin, timeMax) {
    const calendar = google.calendar('v3');
    return new Promise((resolve, reject) => {
        const opts = { auth: authToken,
            calendarId: calendarId,
            timeMin: timeMin || (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime' };

        if (timeMax !== undefined) {
            opts.timeMax = timeMax;
        }

        calendar.events.list(opts, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                reject(err);
                return;
            }
            const events = response.items;
            resolve(events);
        });
    });
}

function addEvent(auth, calendarId, summary) {
    const event = {
        summary,
        start: {
            dateTime: '2017-08-17T19:00:00.000Z'
        },
        end: {
            dateTime: '2017-08-17T19:30:00.000Z'
        },
        attendees: [
            {
                email: ''
            }
        ]
    };

    const calendar = google.calendar('v3');
    calendar.events.insert({
        auth: auth,
        calendarId,
        resource: event
    }, function(err, event) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        console.log(event.htmlLink);
    });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listCalendars() {
    const calendar = google.calendar('v3');
    calendar.calendarList.list({
        auth: authToken
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        const calendars = response.items.map(c => `${c.id} ${c.summary}`);
        console.log(calendars.join('\n'));
    });
}

const listBusyTimes = (calendarIDList, timeMin, timeMax) => {
    console.log('listBusyTimes', calendarIDList, timeMin, timeMax);
    const calendar = google.calendar('v3');
    const items = calendarIDList.map(id => ({ id }));
    return new Promise((resolve, reject) => {
        calendar.freebusy.query({
            auth: authToken,
            resource: {
                timeMin,
                timeMax,
                items
            },
        }, function(err, response) {
            if (err) {
                console.log('listBusyTimes: The API returned an error: ' + err);
                reject(err);
                return;
            }
            const events = response.calendars;
            resolve(events);
        });
    });
}

module.exports = {
    listEvents,
    listBusyTimes
};
