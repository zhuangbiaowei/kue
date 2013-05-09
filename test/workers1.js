var kue = require('../index')
    , jobs = kue.createQueue();

jobs.process('email', function(job, action){
    console.log("start process " + job.id);
    action.next_phase("show");
});