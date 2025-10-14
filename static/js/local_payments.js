(function(){
  var state = { client: null, lpm: null };

  function enableStart(enabled){
    document.getElementById('start').disabled = !enabled;
  }

  function onInit(){
    Playground.log('log', 'Initializing...');
    Playground.fetchClientToken().then(function(res){
      var clientToken = res.clientToken || res;
      braintree.client.create({ authorization: clientToken }, function(err, client){
        if(err){ return Playground.log('log', err); }
        state.client = client;
        braintree.localPayment.create({ client: client }, function(err2, inst){
          if(err2){ return Playground.log('log', err2); }
          state.lpm = inst;
          enableStart(true);
          Playground.appendLog('log', 'Ready');
        });
      });
    });
  }

  function onStart(){
    var amount = document.getElementById('amount').value;
    var currency = document.getElementById('currency').value;
    var countryCode = document.getElementById('countryCode').value;
    var email = document.getElementById('email').value;
    var givenName = document.getElementById('givenName').value;
    var surname = document.getElementById('surname').value;
    var lpm = document.getElementById('lpm').value;
    var issuer = document.getElementById('issuer').value;
    var returnUrl = document.getElementById('returnUrl').value;
    var cancelUrl = document.getElementById('cancelUrl').value;

    if(lpm === 'oxxo'){
      Playground.getJSON('/api/payments/lpm/oxxo/create',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ amount: amount, currency: currency, email: email, givenName: givenName, surname: surname, countryCode: countryCode })
      }).then(function(res){ Playground.log('log', res); }).catch(function(e){ Playground.log('log', e); });
      return;
    }

    state.lpm.startPayment({
      paymentType: lpm,
      amount: amount,
      currencyCode: currency,
      email: email,
      givenName: givenName,
      surname: surname,
      countryCode: countryCode,
      address: {},
      bankId: issuer || undefined,
      fallback: { url: returnUrl, cancelUrl: cancelUrl }
    }, function(err, payload){
      if(err){ return Playground.log('log', err); }
      // For instant methods, payload may include a paymentId to tokenize after approval.
      state.lpm.tokenize({ paymentToken: payload.paymentId }, function(err2, t){
        if(err2){ return Playground.log('log', err2); }
        var settle = document.getElementById('settle').checked;
        Playground.getJSON('/api/payments/lpm/transaction',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ paymentMethodNonce: t.nonce, amount: amount, currency: currency, submitForSettlement: settle, merchantAccountId: document.getElementById('maid').value || null })
        }).then(function(res2){ Playground.log('log', res2); }).catch(function(e2){ Playground.log('log', e2); });
      });
    });
  }

  document.getElementById('init').addEventListener('click', onInit);
  document.getElementById('start').addEventListener('click', onStart);
})();


