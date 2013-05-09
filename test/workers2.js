var kue = require('../index')
    , jobs = kue.createQueue();

jobs.process('email','show',function(job, action){
    console.log("show process " + job.id);
    action.next_phase("send");
});