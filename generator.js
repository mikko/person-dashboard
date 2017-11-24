const _ = require('lodash');

const baseTemplate = `
<!DOCTYPE html>
<html>
	<head>
		<title>Personal dashboard</title>
		<script>
			setTimeout(() => document.location = document.location, 5000)
		</script>
	</head>
	<body style="background-color: black; color: white;">
		<h1><%= person.first_name %> <%= person.last_name %></h1>
		<h2><%= person.title %></h2>
		<% _.forEach(meetings, function(meeting) { %>
			<div><%- meeting %></div> 
		<% }); %> 
	</body>

</html>
`;

const populate = _.template(baseTemplate);

module.exports = (person, meetings) => {
	return populate({ person, meetings });
}
