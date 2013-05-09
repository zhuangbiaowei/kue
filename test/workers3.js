var kue = require('../index')
    , jobs = kue.createQueue();

jobs.process('email', 'send', function(job, action){
    console.log("send process " + job.id);
    action.done();
});