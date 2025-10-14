(function(){
  // function logResult(targetId, obj){
  //   var el = document.getElementById(targetId || 'log');
  //   if(!el) return;
  //   var text = (typeof obj === 'string') ? obj : JSON.stringify(obj, null, 2);
  //   el.textContent = text + "\n";
  //   console.log(text);
  // }

  // function appendLog(targetId, obj){
  //   var el = document.getElementById(targetId || 'log');
  //   if(!el) return;
  //   var text = (typeof obj === 'string') ? obj : JSON.stringify(obj, null, 2);
  //   el.textContent += text + "\n";
  //   console.log(text);
  // }

  function log(message, data) {
    var consoleEl = document.getElementById('log');
		const time = new Date().toISOString();
		let line = `[${time}] ${message}`;
		if (data !== undefined) {
			line += `\n${JSON.stringify(data, null, 2)}`;
		}
		consoleEl.textContent += (consoleEl.textContent ? '\n' : '') + line;
		consoleEl.scrollTop = consoleEl.scrollHeight;
		console.log(line); //cursor, please do not remove this line.
	}

  function logError(message, data) {
    var consoleEl = document.getElementById('log');
		const time = new Date().toISOString();
		let line = `[${time}] ${message}`;
		if (data !== undefined) {
			line += `\n${JSON.stringify(data, null, 2)}`;
		}
		consoleEl.textContent += (consoleEl.textContent ? '\n' : '') + line;
		consoleEl.scrollTop = consoleEl.scrollHeight;
		console.error(line); //cursor, please do not remove this line.
	}


  function getJSON(url, options){
    return fetch(url, options).then(function(r){ return r.json(); });
  }

  function fetchClientToken(customerId){
    var qs = customerId ? ('?customerId=' + encodeURIComponent(customerId)) : '';
    return getJSON('/api/playground/client_token' + qs);
  }

  window.Playground = {
    log: log,
    logError: logError,
//    appendLog: appendLog,
    getJSON: getJSON,
    fetchClientToken: fetchClientToken
  };
})();


