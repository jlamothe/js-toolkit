var jstk = {
  Promise: function(check) {
    var status = 'pending';
    var successChain = [];
    var failureChain = [];
    var result;

    function settle(resolved, value) {
      if(status != 'pending')
        return;
      status = resolved ? 'resolved' : 'rejected';
      result = value;
      if(resolved)
        failureChain = null;
      else
        successChain = null;
      var chain = resolved ? successChain : failureChain;
      while(chain.length > 0)
        result = (chain.shift())(result);
    }

    function resolve(value) {
      settle(true, value);
    }

    function reject(err) {
      settle(false, err);
    }

    function addCallback(resolved, callback) {
      if(status == 'pending') {
        var chain = resolved ? successChain : failureChain;
        chain.push(callback);
      } else if(status == (resolved ? 'resolved' : 'rejected')) {
        result = callback(result);
      }
    }

    this.then = function(successCallback, failureCallback) {
      if(successCallback)
        addCallback(true, successCallback);
      if(failureCallback)
        addCallback(false, failureCallback);
      return this;
    };

    this.success = function(callback) {
      addCallback(true, callback);
      return this;
    };

    this.fail = function(callback) {
      addCallback(false, callback);
      return this;
    };

    this.isPending = function() {
      return status == 'pending';
    };

    this.isResolved = function() {
      return status == 'resolved';
    };

    this.isRejected = function() {
      return status == 'rejected';
    };

    this.isSettled = function() {
      return status != 'pending';
    };

    check(resolve, reject);
  },

  Deferred: function() {
    this.promise = new jstk.Promise(function(resolve, reject) {
      this.resolve = resolve;
      this.reject = reject;
    }.bind(this));
  },

  allPromises: function(promises) {
    var deferred = new this.Deferred();
    var results = [];
    var count = 0;

    function checkResolution() {
      if(count >= promises.length)
        deferred.resolve(results);
    }

    for(i in promises) {
      results.push(null);
      promises[i].then(
        function success(val) {
          count++;
          results[i] = val;
          checkResolution();
        },
        function fail(err) {
          deferred.reject(err);
        }
      );
    }

    checkResolution();
    return deferred.promise;    
  },

  importThenable: function(thenable) {
    var deferred = new this.Deferred();
    thenable.then(
      function success(v) { deferred.resolve(v) },
      function fail(v) { deferred.reject(v) }
    );
    return deferred.promise;
  }
};
