var kue=require('./');
var jobs=kue.createQueue();

var job=jobs.createJob('email','').save();

job.on('complete', function(){
  job.get("return_value",function(err,data){
	  console.log(data);
  });
});