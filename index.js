const _ = require('lodash');
const Hapi = require('hapi');
const generator = require('./generator');
const meetings = require('./meetingRoom');
const peopleDB = require('./people');

const server = new Hapi.Server();

const globals = {
    identifier: '',
    meetings: {}
};

const findPerson = identifier => _.find(peopleDB, p => p.username === identifier) || { title: '-' };


const syncMeetings = (identifier) => {
    const person = findPerson(identifier);
    console.log('Syncing meetings for', person.email);
    meetings.meetingsToday(person.email)
        .then(res => {
            globals.meetings[identifier] = res;
            console.log('Meetings synced', person.email);
        });
}

server.connection({ port: 3000, host: 'localhost' });

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        const person = findPerson(globals.identifier);
        const meetings = _.get(globals, `meetings[${globals.identifier}]`, []);
        const html = generator(person, meetings);
        reply(html);
    }
});

server.route({
    method: 'POST',
    path: `/detection`,
    handler: function (request, reply) {
        const identifier = request.payload.identifier;
        globals.identifier = identifier;
        syncMeetings(identifier);
        reply('OK');
    }

}),

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});
