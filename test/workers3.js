var kue = require('../index')
    , jobs = kue.createQueue();

jobs.process('_mail', 'send', function(job, action){
    console.log("send _mail process " + job.id);
    action.done();
});

jobs.process('email', 'send', function(job, action){
    console.log("send email process " + job.id);
    action.done();
});