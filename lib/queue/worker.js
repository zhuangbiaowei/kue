 /*!
  * kue - Worker
  * Copyright (c) 2011 LearnBoost <tj@learnboost.com>
  * MIT Licensed
  */

 /**
  * Module dependencies.
  */

 var EventEmitter = require('events')
     .EventEmitter,
     redis = require('../redis'),
     events = require('./events'),
     Job = require('./job');

 /**
  * Expose `Worker`.
  */

 module.exports = Worker;

 /**
  * Redis connections used by `getJob()` when blocking.
  */

 var clients = {};

 /**
  * Initialize a new `Worker` with the given Queue
  * targetting jobs of `type`.
  *
  * @param {Queue} queue
  * @param {String} type
  * @api private
  */

 function Worker(queue, type, phase) {
     this.queue = queue;
     this.type = type;
     this.phase = phase;
     this.client = Worker.client || (Worker.client = redis.createClient());
     this.interval = 1000;
 }

 /**
  * Inherit from `EventEmitter.prototype`.
  */

 Worker.prototype.__proto__ = EventEmitter.prototype;

 /**
  * Start processing jobs with the given `fn`,
  * checking for jobs every second (by default).
  *
  * @param {Function} fn
  * @return {Worker} for chaining
  * @api private
  */

 Worker.prototype.start = function(fn) {
     var self = this;
     self.getJob(function(err, job) {
         if (err) self.error(err, job);
         if (!job || err) return process.nextTick(function() {
             self.start(fn);
         });
         self.process(job, fn);
     });
     return this;
 };

 /**
  * Error handler, currently does nothing.
  *
  * @param {Error} err
  * @param {Job} job
  * @return {Worker} for chaining
  * @api private
  */

 Worker.prototype.error = function(err, job) {
     // TODO: emit non "error"
     console.error(err.stack || err.message);
     return this;
 };

 /**
  * Process a failed `job`. Set's the job's state
  * to "failed" unless more attempts remain, in which
  * case the job is marked as "inactive" and remains
  * in the queue.
  *
  * @param {Function} fn
  * @return {Worker} for chaining
  * @api private
  */

 Worker.prototype.failed = function(job, err, fn) {
     var self = this;
     events.emit(job.id, 'failed');
     job.failed()
         .error(err);
     self.error(err, job);
     job.attempt(function(error, remaining, attempts, max) {
         if (error) return self.error(error, job);
         remaining ? job.inactive() : job.failed();
         self.start(fn);
     });
 };

 /**
  * Process `job`, marking it as active,
  * invoking the given callback `fn(job)`,
  * if the job fails `Worker#failed()` is invoked,
  * otherwise the job is marked as "complete".
  *
  * @param {Job} job
  * @param {Function} fn
  * @return {Worker} for chaining
  * @api public
  */

 Worker.prototype.process = function(job, fn) {
     var self = this,
         start = new Date;
     job.active();

     //add return value to done().
     //if goto next phase, call action.next_phase(phase);
     //if success,call action.done(true,data), then job.return_value=data.
     //if failed,call action.done(false,err_message).
     fn(job, {
         next_phase: function(phase) {
             job.phase = phase;
             job.set('phase', phase);
             job.inactive();
             self.emit('job phase', job, phase);
             events.emit(job.id, 'phase', phase);
             self.start(fn);
         },
         done: function(is_success, data) {
             if (is_success == false) {
                 return self.failed(job, data, fn);
             } else {
                 job.set('duration', job.duration = new Date - start);
                 job.set('return_value', data);
                 job.complete();
                 self.emit('job complete', job);
                 events.emit(job.id, 'complete');
                 self.start(fn);
             }
         }
     });
     return this;
 };

 /**
  * Atomic ZPOP implementation.
  *
  * @param {String} key
  * @param {Function} fn
  * @api private
  */

 Worker.prototype.zpop = function(key, fn) {
     this.client.multi()
         .zrange(key, 0, 0)
         .zremrangebyrank(key, 0, 0)
         .exec(function(err, res) {
         if (err) return fn(err);
         var id = res[0][0];
         fn(null, id);
     });
 };

 /**
  * Attempt to fetch the next job.
  *
  * @param {Function} fn
  * @api private
  */

 Worker.prototype.getJob = function(fn) {
     var self = this;

     // alloc a client for this job type
     var client = clients[self.type] || (clients[self.type] = redis.createClient());

     // BLPOP indicates we have a new inactive job to process
     if(self.type[0]=="_" || self.phase[0]=="_"){
         client.blpop('q:' + self.type + ':' + self.phase + ':jobs', 0, function(err,res) {             
             if (err) return fn(err);
             var id= res[1];
             if (!id) return fn();
             Job.get(id, fn);
         });
     } else {
         client.blpop('q:' + self.type + ':' + self.phase + ':jobs', 0, function(err) {
             self.zpop('q:jobs:' + self.type + ':' + self.phase + ':inactive', function(err, id) {
                 if (err) return fn(err);
                 if (!id) return fn();
                 Job.get(id, fn);
             });
         });
     }
 };
