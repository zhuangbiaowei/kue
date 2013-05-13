var kue=require('./');
var jobs=kue.createQueue();

jobs.process('email', function(job, done){
	console.log('process email');
	done(true,'Hello');
});