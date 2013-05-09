var kue = require('../index')
    , jobs = kue.createQueue();

var job=jobs.create('email', {
    title: 'welcome email for tj'
     , to: 'tj@learnboost.com'
     , template: 'welcome-email'
}).save();

job.on('complete', function(){
    console.log("Job complete");
}).on('failed', function(){
    console.log("Job failed");
}).on('phase',function(phase){
    console.log("Job phase is "+phase);
});

jobs.on('job complete', function(id){
    console.log("Job "+id+" complete");
}).on('job phase',function(phase,id){
    console.log("Job "+id+" phase is "+phase);
});