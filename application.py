import braintree.credit_card
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
import braintree
import json
import uuid

application = app = Flask(__name__)
CORS(app)

#gateway Settings
gateway = braintree.BraintreeGateway(
    braintree.Configuration(
        braintree.Environment.Sandbox,
        merchant_id="9dxqqftdw4x6jfbr",
        public_key="jvh5brdvvfkp5sc8",
        private_key="3ede1f4c980113e88173b110124f3607"
    )
)

#statuses
TRANSACTION_SUCCESS_STATUSES = [
    braintree.Transaction.Status.Authorized,
    braintree.Transaction.Status.Authorizing,
    braintree.Transaction.Status.Settled,
    braintree.Transaction.Status.SettlementConfirmed,
    braintree.Transaction.Status.SettlementPending,
    braintree.Transaction.Status.Settling,
    braintree.Transaction.Status.SubmittedForSettlement
]

@app.route("/", methods=["GET"])
def indexHeadless():
    clientToken = getClientToken()
    return render_template("hostedfields.html", clientToken=clientToken)

# @app.route("/dropin-guest", methods=["GET"])
# def indexDropin():
#     clientToken = getClientToken()
#     return render_template("dropin.html", clientToken=clientToken)

@app.route("/createCTAndFetchPMTs", methods=["POST"])
def createCTAndFetchPMTs():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    custId = data["custId"]

    if not findCustomer(custId):
        createCustomerAccount(custId)
 
    clientToken = getClientToken(custId)
    storedPMTs = getStoredPMTs(custId)

    return jsonify({
            "success": True,
            "clientToken": clientToken,
            "storedPMTs": storedPMTs
        })

def getStoredPMTs(customerId):
    print("Fetching stored PMTs for customer: " + customerId)
    result = gateway.customer.find(customerId)
    print("Customer: ", result)
    return constructPMTList(result.payment_methods)

def constructPMTList(paymentMethods):
    pmtList = []
    for pmt in paymentMethods:
        if pmt.__class__ == braintree.credit_card.CreditCard:
            pmtList.append({
                "token": pmt.token,
                "uiCategory": pmt.card_type,
                "maskedNumber": pmt.masked_number, 
                "expirationDate": pmt.expiration_date,
                "expired": pmt.expired,
                "imageUrl": pmt.image_url,
                "uniqueNumberIdentifier": pmt.unique_number_identifier
            })

        #TODO: add other payment method types here
        # elif pmt.__class__ == braintree.paypal_account.PayPalAccount:
        # elif pmt.__class__ == braintree.apple_pay_card.ApplePayCard:
        # elif pmt.__class__ == braintree.android_pay_card.AndroidPayCard:

        else:
            print("Unknown payment method type: ", pmt.type)
            continue
                
    return pmtList

def getClientToken(customerId=None):
    token_params = {
        "merchant_account_id": "stevenchongEUR",
    }
    
    if customerId:
        token_params["customer_id"] = customerId
        
    clientToken = gateway.client_token.generate(token_params)
    print("Client token created: ")
    print(clientToken)
    return clientToken

@app.route("/createPayment", methods=["POST"])
def createPayment():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    nonce_from_the_client = data["payment_method_nonce"]
    amount = data["amount"]
    customerId = data.get("customerId")  # Safe access
    storeInVault = data.get("storeInVault")  # Safe access
    pmtToken = data.get("pmtToken")

    return createTransaction(nonce_from_the_client, amount, customerId, storeInVault, pmtToken)

def createTransaction(nonce_from_the_client, amount, customerId=None, storeInVault=False, pmtToken=None):
    tranReq = transactionSaleRequest(nonce_from_the_client, amount, customerId, storeInVault, pmtToken)
    orderId = tranReq["order_id"]
    result = gateway.transaction.sale(tranReq)
    if result.is_success:
        print("Transaction is processed successfully:")
        print("  Transaction id: {}, Transaction status: {}, Order id: {}, Amount: {}".format(result.transaction.id, result.transaction.status, orderId, amount))
        return jsonify({
            "success": True,
            "transaction_id": result.transaction.id,
            "transaction_status": result.transaction.status,
            "order_id": orderId,
            "amount": amount
        })
    elif hasattr(result, 'transaction') and result.transaction:
        print("Error processing transaction:")
        print("  Transaction id: {}, Order id: {}".format(result.transaction.id, orderId))
        print("  Error Code: {}, Error Message: {}".format(result.transaction.processor_response_code, result.transaction.processor_response_text))
        return jsonify({
            "success": False,
            "order_id": orderId,
            "error_message": result.transaction.processor_response_text,
            "error_code": result.transaction.processor_response_code
        })
    else:
        print("Validation error:")
        print("  Order id: {}".format(orderId))
        error_messages = []
        for x in result.errors.deep_errors: 
            print("  Error Attribute: {}, Error Code: {}, Error Message: {}".format(x.attribute, x.code, x.message))
            error_messages.append(x.message)
        return jsonify({
            "success": False,
            "order_id": orderId,
            "error_message": "; ".join(error_messages),
            "error_type": "validation"
        })

def transactionSaleRequest(nonce_from_the_client, amount, customerId=None, storeInVault=False, pmtToken=None):
    baseOb = {
        "amount": amount,
        "payment_method_nonce": nonce_from_the_client,
        "order_id": str(uuid.uuid1()),
        "options": {
            "submit_for_settlement": True
        }
    }

    if customerId is not None:
        baseOb["customer_id"] = customerId  

    if storeInVault:
        baseOb["options"]["store_in_vault_on_success"] = True

    if pmtToken is not None:
        baseOb["payment_method_token"] = pmtToken


    print ("Transaction request obj: ")
    print (baseOb)
    return baseOb

@app.route("/checkouts/<transaction_id>", methods=["GET"])
def showSuccessfulTransaction(transaction_id):
    transaction = gateway.transaction.find(transaction_id) 
    print (transaction)
    return render_template("paymentResultPage.html", transaction=transaction, isSuccess=True, orderId=transaction.order_id)

@app.route("/error/<orderId>", methods=["GET"])
def errorProcessingPage(orderId):
    return render_template("paymentResultPage.html", orderId=orderId, isSuccess=False)


#standalone card verification. 
#def verifyCard(customerId,nonce_from_the_client):
#    print ("verifying card")
#    result = gateway.payment_method.create({
#        "customer_id": customerId,
#        "payment_method_nonce": nonce_from_the_client,
#        "options": {
#            "verify_card": True
#        }
#    })
#    print(result)
#    if result.is_success:
#        verification = result.payment_method.verification
#    else: 
#        for error in result.errors.deep_errors:
#            print(error.code)
#            print(error.message)    
#    return result


def findCustomer(customerId):
    print("checking existance of customer id: " + customerId)
    try:    
        customer = gateway.customer.find(customerId)
        print("  customer id {} found!".format(customerId))
        return True
    except braintree.exceptions.not_found_error.NotFoundError as e:
        print("  customer id {} NOT found!".format(customerId))
        return False

def createCustomerAccount(cid):
    print("creating new customer: ")
    result = gateway.customer.create({
        "first_name": 'custFirstName',
        "last_name": 'custLastName',
        "company": "Braintree",
        "email": "jen@example.com",
        "phone": "312.555.1234",
        "fax": "614.555.5678",
        "website": "www.example.com",
        "id": cid
    })
    if result.is_success: 
        print("  customer id {} created!".format(result.customer.id))
        print("  global customer id changed to {}".format(result.customer.id))
        return result.customer.id
    else:
    #TODO: when have time, try to see how to properly handle. Now just assume always successful
        print("  customer id {} NOT created!".format(cid))
        raise Exception('User creation failed. Unknown error. cid {}'.format(cid))



# Run the backend app
if __name__ == "__main__":
    app.run(debug=True)
#    app.run(host="0.0.0.0", port=8000, debug=True)
#    app.run(debug=True, host="0.0.0.0", port=50000)

