var kue = require('../index')
    , jobs = kue.createQueue();

jobs.process('_mail','show',function(job, action){
    console.log("show _mail process " + job.id);
    action.next_phase("send");
});

jobs.process('email','show',function(job, action){
    console.log("show email process " + job.id);
    action.next_phase("send");
});