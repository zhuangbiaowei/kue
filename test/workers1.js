var kue = require('../index')
    , jobs = kue.createQueue();

jobs.process('_mail', function(job, action){
    console.log("start _mail process " + job.id);
    action.next_phase("show");
});

jobs.process('email', function(job, action){
    console.log("start email process " + job.id);
    action.next_phase("show");
});