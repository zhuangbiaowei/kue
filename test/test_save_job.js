var kue = require("../");
var jobs = kue.createQueue();

jobs.create("_mail",{title:"test"}).save();