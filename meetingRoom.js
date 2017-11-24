const _ = require('lodash');
const Moment = require('moment');
const GoogleCal = require('./googlecal');

const config = require('./config');

const calList = 

const getNow = () => new Moment();
const getTodayStart = () => Moment().startOf('day');
const getTodayEnd = () => Moment().endOf('day');

const meetingsToday = (userEmail) => {
  const promises = calList
    .map(cal => GoogleCal.listEvents(cal.id, getTodayStart().toISOString(), getTodayEnd().toISOString()));
  return Promise.all(promises)
    .then(rooms => {
      let resultRows = [];
      rooms.forEach((events, i) => {
        const roomName = calList[i].name;
        events.forEach(event => {
          const people = [_.get(event, 'creator.email'), ..._.get(event, 'attendees', []).map(attendee => attendee.email)]
          if (people.indexOf(userEmail) > -1) {
            const start = Moment(event.start.dateTime).format('HH:mm');
            const end = Moment(event.end.dateTime).format('HH:mm');
            const row = `${start} - ${end} ${roomName}`;
            resultRows.push(row);
          }
        })
      })
      resultRows.sort();
      return Promise.resolve(resultRows);
    });
};

module.exports = {
    meetingsToday
};
