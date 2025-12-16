import os
import braintree.credit_card
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory
from flask_cors import CORS
from enum import Enum
#from pyngrok import ngrok, conf
import braintree
import json
import uuid
import requests
from requests.auth import HTTPBasicAuth
import base64


from threading import Thread
from time import sleep


application = app = Flask(__name__)
CORS(app)

# Only run ngrok in the main process
# if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
#     conf.get_default().auth_token = "32uKRHazrubW8TBFVXjBEw0c7m1_2Z2UKNNZEvb5bYcGttztK"
#     public_url = ngrok.connect(5000, "http").public_url
#     print(" * Ngrok tunnel URL:", public_url)

#     # Update environment or .env if needed
#     os.environ["PUBLIC_URL"] = public_url

class PP_CREDENTIALS(Enum):
    LEACHONG = {
        #leachong@paypal.com - SG Merchant account
        "username": "AUU0Jtg24SEu5dLLc9666tXHDn9jNa6jK3NzvciB6L2bdJdzsrtK0pVf8dBGXew356RgsuF96N9JwQGg",
        "password": "EHVzVi_HdHuqMjQVYQQx7NF8klp7E4qrZA8GVvZSTvSZ5Vxc4lQ3Cu67Rr9OtPqvxyDC-7E5RcBXCsAj"
    }
    LEACHONG_MY = {
        #leachong-my@paypal.com - MY Merchant account
        "username": "Ab7PV4MNIymVgzPbDHNdAKtbYSRJvI9alA9lGso_dDrpgGaiVNyCbW4xO7Xb2ithkDwI1QE7ArJOKmOk",
        "password": "ENh9kVABew5fn9QFCILYOR3491n_mztetpZ8DOrSdzDRMNPzBoUE1f6b3wr8tcSj0AR5EJFkG8BFdD8D"
    }
    LEACHONG_HK = {
        #rcvr-hk-1@gmail.com - HK Merchant account
        "username": "AQCfBdKURR7-n-y9466s_Q66bksi4hqsVDueUhmf2dpzC7CuLv-KQdmy9ABRoRXLNIIR5mw3zXrmgtfa",
        "password": "EGeA0eW3FHr5soQ7Z37J0YRyOfJMvDvzQkuAp0Q575-k7iIPSkzZ-2Z0hZ1828ApCN-VQ2nsEaDfnxgZ"
    }
    LEACHONG_US = {
        #rcvr-us-ppcp-1@gmail.com - US Merchant account
        "username": "AfTNXk4kvRIFYs2anTBbdf9__03iuJIQodXxCjtGdQQR-oLKaeBt26nz8kSbq4nw0zoHHYTcVw8OAMeX",
        "password": "EIbrrlOv2mI9okw9-YQJRNarqDUOrCOreBgEYeHkjeEh3lDMhytGCLqrIlVXrENb8GC394022048af3B"
    }
    LEACHONG_PT = {
        #rcvr-pt-1@gmail.com - PT Merchant account
        "username": "AYBAxNLRTthLkDdk6IwQHTRr-Df4NAf1Nm5hBE-7yZWkVit7H8_tL8XJ2IXy9dh7NYm7wLErLHtBcywO",
        "password": "EMb349cjiOikq0JjlhD3AQgab7fDjuyK8rPe3UXlNmb5ezLp35uxeJnSLrQgfhB1I49Iq75MZVrWxJsm"
    }


    FOR_FLASK = LEACHONG_US

    #my leachong@paypal.com
    #username='AUU0Jtg24SEu5dLLc9666tXHDn9jNa6jK3NzvciB6L2bdJdzsrtK0pVf8dBGXew356RgsuF96N9JwQGg' #client id
    #password='EHVzVi_HdHuqMjQVYQQx7NF8klp7E4qrZA8GVvZSTvSZ5Vxc4lQ3Cu67Rr9OtPqvxyDC-7E5RcBXCsAj' #client secret

    #hk rcvt rcvr-hk-1@gmail.com
    # username='AQCfBdKURR7-n-y9466s_Q66bksi4hqsVDueUhmf2dpzC7CuLv-KQdmy9ABRoRXLNIIR5mw3zXrmgtfa' #client id
    # password='EGeA0eW3FHr5soQ7Z37J0YRyOfJMvDvzQkuAp0Q575-k7iIPSkzZ-2Z0hZ1828ApCN-VQ2nsEaDfnxgZ' #client secret

    #my rcvt leachong-my@paypal.com
    #username='Ab7PV4MNIymVgzPbDHNdAKtbYSRJvI9alA9lGso_dDrpgGaiVNyCbW4xO7Xb2ithkDwI1QE7ArJOKmOk' #client id
    #password='ENh9kVABew5fn9QFCILYOR3491n_mztetpZ8DOrSdzDRMNPzBoUE1f6b3wr8tcSj0AR5EJFkG8BFdD8D' #client secret

#gateway Settings
gateway = braintree.BraintreeGateway(
    braintree.Configuration(
        braintree.Environment.Sandbox,
        #bt cvenchong@gmail.com
        # merchant_id="9dxqqftdw4x6jfbr",
        # public_key="jvh5brdvvfkp5sc8",
        # private_key="3ede1f4c980113e88173b110124f3607"

        #bt cvenchong+us@gmail.com
        merchant_id="d6dyn57dn7yysw2b",
        public_key="6285k8qst8wybnkd",
        private_key="073d630c7b39ebf0bf47d34e8c3562c7"

        #chai heng account
        # merchant_id="mq3fyc7sdb4vgngm",
        # public_key="5pgtnzyxf3ctvmpw",
        # private_key="06ed8957973869330d91b2d8a89292a2"

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

#merchant account id
class MAID(Enum):
    #for use with gateway 9dxqqftdw4x6jfbr
    USD_DEFAULT_STEVENCHONG = "stevenchong"
    AUD_STEVENCHONG = "stevenchongAUD"
    EUR_STEVENCHONG = "stevenchongEUR"
    GBP_STEVENCHONG = "stevenchongGBP"
    SGD_STEVENCHONG = "stevenchongSGD"
    EUR_DE_HUAWEI = "huawei_DE_EUR"
    EUR_ES_HUAWEI = "huawei_ES_EUR"
    EUR_FR_HUAWEI = "huawei_FR_EUR"
    EUR_IT_HUAWEI = "huawei_IT_EUR"
    EUR_NL_HUAWEI = "huawei_NL_EUR"
    EUR_PT_HUAWEI = "huawei_PT_EUR"
    GBP_UK_HUAWEI = "huawei_UK_GBP"
    #for use with gateway d6dyn57dn7yysw2b
    stevenustest = "stevenustest" #USD
    stevenustest_GBP = "stevenustest_GBP" #GBP
    leachong_EUR = "leachong_EUR"
    leachong_USD = "leachong_USD"
    RVCR_PT_EUR = "RVCR_PT_EUR"
    RVCR_PT_USD = "RVCR_PT_USD"


    CHAIHENG_MAID = "paypal"


PROCESSING_MAID = MAID.stevenustest_GBP.value

#merchant account id
class SUBSCRIPTION_PLAN_ID(Enum): #support min month. No weekly billing cycle.
    MONTHLY_USD_10 = "jzzb"
    MONTHLY_USD_15 = "h24r"
    MONTHLY_EUR_9 = "d6yj"

DEFAULT_PLAN_ID = SUBSCRIPTION_PLAN_ID.MONTHLY_EUR_9.value

#a simple list of order objects to keep track of active orders
active_orders = []

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route('/order-summary/<order_id>', methods=["GET"])
def serve_order_confirmation(order_id):
    print("Serving order summary for order_id: ", order_id)

    order = findActiveOrder(order_id)
    order_details_json = json.dumps(order, indent=2)


    html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Order Summary</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .container {{ max-width: 700px; margin: auto; background: #f7f7f7; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px #ccc; }}
                h1 {{ color: #0070ba; }}
                pre {{ background: #222; color: #eee; padding: 16px; border-radius: 6px; font-size: 0.95em; overflow-x: auto; }}
            </style>
        </head>
        <body>
            <a href="/">Main Page</a>
            <div class="container">
                <h1>Payment Summary</h1>
                <p><strong>Order ID:</strong> {order.id}</p>
                <h2>Order Details</h2>
                <pre>{order_details_json}</pre>
            </div>
        </body>
        </html>
        """
    return html

@app.route('/public/<path:filename>')
def serve_public(filename):
    print("Serving public file: ", filename)

    # check if query param exists
    order_id = request.args.get('token')
    payer_id = request.args.get('PayerID')
    if order_id and payer_id:
        # Handle the case where both order_id and payer_id are present 
        # Get Order details from PayPal
        clientToken = post_pp_client_token()
        order_details = get_pp_order_details( clientToken, order_id)
        order_details_json = json.dumps(order_details, indent=2)

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Order Confirmation</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .container {{ max-width: 700px; margin: auto; background: #f7f7f7; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px #ccc; }}
                h1 {{ color: #0070ba; }}
                pre {{ background: #222; color: #eee; padding: 16px; border-radius: 6px; font-size: 0.95em; overflow-x: auto; }}
            </style>
        </head>
        <body>
            <a href="/">Main Page</a>
            <div class="container">
                <h1>Payment Confirmation</h1>
                <p><strong>Order ID:</strong> {order_id}</p>
                <p><strong>Payer ID:</strong> {payer_id}</p>
                <p>Thank you for your payment!</p>
                <h2>Order Details</h2>
                <pre>{order_details_json}</pre>
            </div>
        </body>
        </html>
        """
        return html

    template_uri = "public/" + filename
    return render_template(template_uri)




@app.route("/pp/lipp", methods=["GET"])
def lipp():
    clientToken = getClientToken()
    return render_template("public/paypal/lipp.html", clientToken=clientToken)

@app.route("/pp/venmo", methods=["GET"])
def ppcpvenmo():
    clientToken = getClientToken()
    return render_template("venmo.html", clientToken=clientToken)


@app.route("/pp/bnpl", methods=["GET"])
def ppcpbnpl():
    return render_template("pp_bnpl.html")


@app.route("/hostedfield", methods=["GET"])
def hostedField():
    clientToken = getClientToken()
    return render_template("hostedfields.html", clientToken=clientToken)

@app.route("/dropin-advanced", methods=["GET"])
def dropin_advanced():
    # Render the new advanced Drop-in demo. Client token will be fetched via XHR to /createCTAndFetchPMTs
    return render_template("dropin_advanced.html")

# @app.route("/dropin-guest", methods=["GET"])
# def indexDropin():
#     clientToken = getClientToken()
#     return render_template("dropin.html", clientToken=clientToken)

@app.route("/createCTAndFetchPMTs", methods=["POST"])
def createCTAndFetchPMTs():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    custId = data.get("custId")  # ✅ returns None instead of error if key is not present

    if (not findCustomer(custId) and custId != 'guest'):
        createCustomerAccount(custId)
 
    clientToken = getClientToken(custId)
    storedPMTs = getStoredPMTs(custId)

    return jsonify({
            "success": True,
            "clientToken": clientToken,
            "storedPMTs": storedPMTs
        })

@app.route("/api/get-payment-methods", methods=["GET"])
def fetchPMTs():
    # Fetch stored payment methods for a given customerId
    cid = request.args.get("customerId")  # assuming userId is passed as query param
    
    if findCustomer(cid):
        PMTs = getStoredPMTs(cid)
    else:
        PMTs = []
    
    return jsonify({
        "success": True,
        "PMTs": PMTs
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
        elif pmt.__class__ == braintree.paypal_account.PayPalAccount:
            pmtList.append({
                "customerId": pmt.customer_id,
                "customer_global_id": pmt.customer_global_id,
                "token": pmt.token,
                "token_globalId": pmt.global_id,
                "billingAgreementId": pmt.billing_agreement_id,
                "funding_source_description": pmt.funding_source_description,

                "email": pmt.email,
                "payer_id": pmt.payer_id,

                "uiCategory": "PayPal",
                "imageUrl": pmt.image_url
            })
        # elif pmt.__class__ == braintree.apple_pay_card.ApplePayCard:
        # elif pmt.__class__ == braintree.android_pay_card.AndroidPayCard:

        else:
            print("Unknown payment method type: ", pmt.type)
            continue
                
    return pmtList

def getClientTokenMAID(maid, customerId=None):
    token_params = {
        "merchant_account_id": maid,
    }
    print("Generating client token with params:", token_params)
    
    if customerId:
        token_params["customer_id"] = customerId
        
    clientToken = gateway.client_token.generate(token_params)
    print("Client token created: ")
    print(clientToken)
    return clientToken

def getClientToken(customerId=None):
    token_params = {
        "merchant_account_id": PROCESSING_MAID,
    }
    
    if customerId:
        token_params["customer_id"] = customerId
        
    clientToken = gateway.client_token.generate(token_params)
    print("Client token created: ")
    print(clientToken)
    return clientToken
# =============================
# NEW PLAYGROUND ROUTES (Additive)
# Pages: Google Pay, Local Payments, PayPal
# APIs: client token and Google Pay transaction
# Each route below is used by the new templates only and does not modify existing functions.
# =============================

@app.route("/google-pay", methods=["GET"])
def page_google_pay():
    """Render Google Pay playground page (templates/googlepay.html)."""
    return render_template("googlepay.html")

@app.route("/local-payments", methods=["GET"])
def page_local_payments():
    """Render Local Payment Methods playground page (templates/local_payments.html)."""
    return render_template("local_payments.html")


@app.route("/paypal", methods=["GET"])
def page_paypal():
    """Render PayPal playground page (templates/paypal.html)."""
    return render_template("paypal.html")


@app.route("/checkout/farfetch", methods=["GET"])
def page_farfetch_checkout():
    """Render Farfetch-style checkout page."""
    return render_template("public/paypal/js-sdk/sdk/farfetch/farfetch.html")


@app.route("/client-side-card-tokenization", methods=["GET"])
def page_client_side_card_tokenization():
    """Render client-side card tokenization page (PCI SAQ D compliant)."""
    return render_template("client_side_ql_card_tokenization.html")


@app.route("/server-side-card-tokenization", methods=["GET"])
def page_server_side_card_tokenization():
    """Render server-side card tokenization page (PCI SAQ D compliant)."""
    return render_template("server_side_ql_card_tokenization.html")


@app.route("/server-side-graphql-card-tokenization", methods=["GET"])
def page_server_side_graphql_card_tokenization():
    """Render server-side GraphQL card tokenization page (PCI SAQ D compliant)."""
    return render_template("server_side_graphql_card_tokenization.html")


@app.route("/braintree/sdk/auth/client", methods=["POST"])
def public_bt_client_token():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    custId = data.get("custId")  # ✅ returns None instead of error if key is not present
    maid = data.get("merchantAccountId")  # ✅ returns None instead of error if key is not present


    token = getClientTokenMAID(maid, custId)
    return jsonify({
        "success": True,
        "token": token
    })


@app.route("/api/playground/client_token", methods=["GET"])
def api_playground_client_token():
    """Generate a client token for playground pages.
    Used by: googlepay.html, local_payments.html, paypal.html
    Optional query param: customerId
    """
    cid = request.args.get("customerId")
    token = getClientToken(cid)
    return jsonify({
        "success": True,
        "clientToken": token
    })


@app.route("/api/tokenize-card", methods=["POST"])
def api_tokenize_card():
    """Server-side card tokenization endpoint.
    Receives raw card data and tokenizes it using Braintree gateway.
    WARNING: Requires PCI DSS SAQ D compliance.
    """
    try:
        data = request.get_json()
        
        # Extract card data
        card_number = data.get("cardNumber")
        expiration_date = data.get("expirationDate")
        cvv = data.get("cvv")
        cardholder_name = data.get("cardholderName")
        billing_address = data.get("billingAddress")
        
        # Validate required fields
        if not card_number or not expiration_date or not cvv:
            return jsonify({
                "success": False,
                "error": "Missing required card fields"
            }), 400
        
        # Build credit card params for Braintree
        card_params = {
            "number": card_number,
            "expiration_date": expiration_date,
            "cvv": cvv,
            "options": {
                "verify_card": False  # Set to True to verify with gateway
            }
        }
        
        # Add cardholder name if provided
        if cardholder_name:
            card_params["cardholder_name"] = cardholder_name
        
        # Add billing address if provided
        if billing_address:
            card_params["billing_address"] = {}
            if billing_address.get("postalCode"):
                card_params["billing_address"]["postal_code"] = billing_address["postalCode"]
            if billing_address.get("streetAddress"):
                card_params["billing_address"]["street_address"] = billing_address["streetAddress"]
            if billing_address.get("locality"):
                card_params["billing_address"]["locality"] = billing_address["locality"]
            if billing_address.get("region"):
                card_params["billing_address"]["region"] = billing_address["region"]
            if billing_address.get("countryCodeAlpha2"):
                card_params["billing_address"]["country_code_alpha2"] = billing_address["countryCodeAlpha2"]
        
        print("Server-side tokenization request:", {
            **card_params,
            "number": "****",
            "cvv": "***"
        })
        
        # Tokenize using Braintree gateway
        result = gateway.payment_method.create({
            "customer_id": None,  # Not associating with a customer
            "payment_method_nonce": None,
            "credit_card": card_params
        })
        
        printBTResponse(result)
        
        if result.is_success:
            credit_card = result.payment_method
            return jsonify({
                "success": True,
                "nonce": credit_card.token,
                "cardType": credit_card.card_type,
                "lastFour": credit_card.last_4,
                "lastTwo": credit_card.last_4[-2:] if len(credit_card.last_4) >= 2 else credit_card.last_4,
                "bin": credit_card.bin,
                "expirationMonth": credit_card.expiration_month,
                "expirationYear": credit_card.expiration_year,
                "cardholderName": credit_card.cardholder_name if hasattr(credit_card, 'cardholder_name') else None
            })
        else:
            error_messages = []
            if hasattr(result, 'errors'):
                for error in result.errors.deep_errors:
                    error_messages.append(f"{error.code}: {error.message}")
            
            error_text = "; ".join(error_messages) if error_messages else result.message
            
            return jsonify({
                "success": False,
                "error": error_text,
                "details": error_messages
            }), 400
            
    except Exception as e:
        print(f"Error in server-side tokenization: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/tokenize-card-graphql", methods=["POST"])
def api_tokenize_card_graphql():
    """Server-side card tokenization endpoint using Braintree GraphQL API.
    Receives raw card data and tokenizes it using Braintree GraphQL.
    WARNING: Requires PCI DSS SAQ D compliance.
    """
    try:
        data = request.get_json()
        
        # Extract card data
        card_number = data.get("cardNumber")
        expiration_date = data.get("expirationDate")
        cvv = data.get("cvv")
        cardholder_name = data.get("cardholderName")
        billing_address = data.get("billingAddress")
        
        # Validate required fields
        if not card_number or not expiration_date or not cvv:
            return jsonify({
                "success": False,
                "error": "Missing required card fields"
            }), 400
        
        # Parse expiration date (MM/YY)
        if '/' in expiration_date:
            month, year = expiration_date.split('/')
            # Convert YY to YYYY
            if len(year) == 2:
                year = '20' + year
        else:
            return jsonify({
                "success": False,
                "error": "Invalid expiration date format. Use MM/YY"
            }), 400
        
        # Build GraphQL mutation
        graphql_mutation = """
            mutation TokenizeCreditCard($input: TokenizeCreditCardInput!) {
                tokenizeCreditCard(input: $input) {
                    paymentMethod {
                        id
                        usage
                        details {
                            ... on CreditCardDetails {
                                brandCode
                                last4
                                bin
                                expirationMonth
                                expirationYear
                                cardholderName
                            }
                        }
                    }
                }
            }
        """
        
        # Build input variables
        credit_card_input = {
            "number": card_number,
            "expirationMonth": month,
            "expirationYear": year,
            "cvv": cvv
        }
        
        if cardholder_name:
            credit_card_input["cardholderName"] = cardholder_name
        
        if billing_address:
            address_input = {}
            if billing_address.get("postalCode"):
                address_input["postalCode"] = billing_address["postalCode"]
            if billing_address.get("streetAddress"):
                address_input["streetAddress"] = billing_address["streetAddress"]
            if billing_address.get("locality"):
                address_input["locality"] = billing_address["locality"]
            if billing_address.get("region"):
                address_input["region"] = billing_address["region"]
            if billing_address.get("countryCodeAlpha2"):
                address_input["countryCode"] = billing_address["countryCodeAlpha2"]
            
            if address_input:
                credit_card_input["billingAddress"] = address_input
        
        variables = {
            "input": {
                "creditCard": credit_card_input
            }
        }
        
        # Log request (with masked data)
        print("GraphQL tokenization request:", {
            "mutation": "tokenizeCreditCard",
            "cardNumber": "****",
            "cvv": "***",
            "hasAddress": bool(billing_address)
        })
        
        # Get client token for authorization
        client_token = getClientToken()

        # To obtain an authorization fingerprint you must Base64 decode a client token, the decoded client token will contain an authorizationFingerprint value, which can then be passed in the Authorization header.
        decoded_token = base64.b64decode(client_token).decode('utf-8')
        token_info = json.loads(decoded_token)
        authorization_fingerprint = token_info.get("authorizationFingerprint")

        # Make GraphQL request to Braintree
        graphql_url = "https://payments.sandbox.braintree-api.com/graphql"
        
        graphql_response = requests.post(
            graphql_url,
            headers={
                "Authorization": f"Bearer {authorization_fingerprint}",
                "Braintree-Version": "2025-11-19",
                "Content-Type": "application/json"
            },
            json={
                "query": graphql_mutation,
                "variables": variables
            }
        )
        
        graphql_response.raise_for_status()
        result = graphql_response.json()
        
        print("GraphQL Response:")
        print(json.dumps(result, indent=2))
        
        # Check for GraphQL errors
        if "errors" in result:
            error_messages = []
            for error in result["errors"]:
                error_messages.append(error.get("message", "Unknown error"))
            
            return jsonify({
                "success": False,
                "error": "; ".join(error_messages),
                "details": result["errors"]
            }), 400
        
        # Extract payment method data
        if "data" in result and "tokenizeCreditCard" in result["data"]:
            payment_method = result["data"]["tokenizeCreditCard"]["paymentMethod"]
            details = payment_method["details"]
            
            return jsonify({
                "success": True,
                "nonce": payment_method["id"],
                "usage": payment_method["usage"],
                "cardType": details["brandCode"],
                "lastFour": details["last4"],
                "bin": details["bin"],
                "expirationMonth": details["expirationMonth"],
                "expirationYear": details["expirationYear"],
                "cardholderName": details.get("cardholderName"),
                "graphqlResponse": result
            })
        else:
            return jsonify({
                "success": False,
                "error": "Unexpected GraphQL response format",
                "details": result
            }), 500
            
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error in GraphQL tokenization: {str(e)}")
        try:
            error_details = e.response.json()
            return jsonify({
                "success": False,
                "error": "GraphQL request failed",
                "details": error_details
            }), e.response.status_code
        except:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    except Exception as e:
        print(f"Error in GraphQL tokenization: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/lookup-3ds-graphql", methods=["POST"])
def api_lookup_3ds_graphql():
    """Perform 3DS lookup using Braintree GraphQL API.
    
    This is called after client-side prepareLookup() completes.
    
    Request body:
    {
        "nonce": "payment_method_nonce",
        "bin": "411111",
        "amount": "10.00",
        "email": "customer@example.com",
        "billingAddress": {...},
        "browserInfo": {
            "javaEnabled": false,
            "acceptHeader": "...",
            "language": "en-US",
            "colorDepth": 24,
            "screenHeight": 1080,
            "screenWidth": 1920,
            "timeZone": "-480",
            "userAgent": "...",
            "javascriptEnabled": true
        },
        "ipAddress": "192.168.1.1"
    }
    """
    try:
        data = request.json
        print("Received JSON for 3DS lookup:", data)
        
        nonce = data.get("nonce")
        amount = data.get("amount")
        bin = data.get("bin")
        email = data.get("email")

        merchantAccountId = data.get("merchantAccountId", PROCESSING_MAID)

        prepareLookupResult = data.get("prepareLookupResult", {}) #make this into a json object and access its data
        prepareLookupResult = json.loads(prepareLookupResult)
        
        dfReferenceId = prepareLookupResult.get("dfReferenceId", {})
        
        transactionInformation = data.get("transactionInformation", {})
        
        cardHolderInfo = data.get("cardHolderInfo", {})
        
        requestedExemptionTypes = data.get("requestedExemptionTypes", None)
        requestAuthenticationChallenge = data.get("requestAuthenticationChallenge", False)
        
        
        
        if not nonce or not amount:
            return jsonify({
                "success": False,
                "error": "Missing required fields: nonce and amount"
            }), 400
        
        # Build GraphQL mutation for 3DS lookup
        graphql_mutation = """
            mutation PerformThreeDSecureLookup($input: PerformThreeDSecureLookupInput!) {
                performThreeDSecureLookup(input: $input) {
                    clientMutationId
                    threeDSecureLookupData {
                        authenticationId
                    }
                    paymentMethod {
                        id
                        usage
                        details {
                            ... on CreditCardDetails {
                                bin
                                brandCode
                                last4
                                threeDSecure {
                                    authentication {
                                        cavv
                                        eciFlag
                                        liabilityShifted
                                        liabilityShiftPossible
                                        threeDSecureVersion
                                        transactionId
                                    }
                                }
                            }
                        }
                    }
                }
            }
        """
        
        # Build lookup input
        lookup_input = {
            "paymentMethodId": nonce,
            "amount": str(amount),
            "dfReferenceId": dfReferenceId,
            "requestedExemptionTypes": requestedExemptionTypes,
            "requestAuthenticationChallenge": requestAuthenticationChallenge,
            "cardHolderInfo": cardHolderInfo,
            "transactionInformation": transactionInformation,
            "merchantAccountId": merchantAccountId
        }
        
        # # Add browser information if provided
        # if browser_info:
        #     browser_information = {}
            
        #     if browser_info.get("javaEnabled") is not None:
        #         browser_information["javaEnabled"] = browser_info["javaEnabled"]
        #     if browser_info.get("javascriptEnabled") is not None:
        #         browser_information["javascriptEnabled"] = browser_info["javascriptEnabled"]
        #     if browser_info.get("acceptHeader"):
        #         browser_information["acceptHeader"] = browser_info["acceptHeader"]
        #     if browser_info.get("language"):
        #         browser_information["language"] = browser_info["language"]
        #     if browser_info.get("colorDepth"):
        #         browser_information["colorDepth"] = int(browser_info["colorDepth"])
        #     if browser_info.get("screenHeight"):
        #         browser_information["screenHeight"] = int(browser_info["screenHeight"])
        #     if browser_info.get("screenWidth"):
        #         browser_information["screenWidth"] = int(browser_info["screenWidth"])
        #     if browser_info.get("timeZone"):
        #         browser_information["timeZone"] = str(browser_info["timeZone"])
        #     if browser_info.get("userAgent"):
        #         browser_information["userAgent"] = browser_info["userAgent"]
            
        #     if browser_information:
        #         lookup_input["transactionInformation"]["browserInformation"] = browser_information
        
        # Add IP address if provided
        # if ip_address:
        #     lookup_input["transactionInformation"]["ipAddress"] = ip_address
        
        variables = {
            "input": lookup_input
        }
        
        #print lookup input
        print("GraphQL 3DS lookup request:", {
            "lookup_input": lookup_input
        })
        
        # Get client token for authorization
        client_token = getClientTokenMAID(merchantAccountId)
        
        # Make GraphQL request
        graphql_url = "https://payments.sandbox.braintree-api.com/graphql"
        
        graphql_response = requests.post(
            graphql_url,
            headers={
                "Authorization": f"Bearer {client_token}",
                "Braintree-Version": "2021-02-01",
                "Content-Type": "application/json"
            },
            json={
                "query": graphql_mutation,
                "variables": variables
            }
        )
        
        graphql_response.raise_for_status()
        result = graphql_response.json()
        
        print("GraphQL 3DS Lookup Response:")
        print(json.dumps(result, indent=2))
        
        # Check for GraphQL errors
        if "errors" in result:
            error_messages = []
            for error in result["errors"]:
                error_messages.append(error.get("message", "Unknown error"))
            
            return jsonify({
                "success": False,
                "error": "; ".join(error_messages),
                "details": result["errors"]
            }), 400
        
        # Extract lookup data
        if "data" in result and "performThreeDSecureLookup" in result["data"]:
            lookup_data = result["data"]["performThreeDSecureLookup"]
            payment_method = lookup_data["paymentMethod"]
            three_ds_lookup = lookup_data.get("threeDSecureLookupData", {})
            
            # Extract card details and 3DS authentication info
            card_details = payment_method.get("details", {})
            three_ds_auth = card_details.get("threeDSecure", {}).get("authentication", {})
            
            return jsonify({
                "success": True,
                "nonce": payment_method["id"],
                "authenticationId": three_ds_lookup.get("authenticationId"),
                "bin": card_details.get("bin"),
                "brandCode": card_details.get("brandCode"),
                "lastFour": card_details.get("last4"),
                "threeDSecure": {
                    "cavv": three_ds_auth.get("cavv"),
                    "eciFlag": three_ds_auth.get("eciFlag"),
                    "liabilityShifted": three_ds_auth.get("liabilityShifted"),
                    "liabilityShiftPossible": three_ds_auth.get("liabilityShiftPossible"),
                    "threeDSecureVersion": three_ds_auth.get("threeDSecureVersion"),
                    "transactionId": three_ds_auth.get("transactionId")
                },
                "graphqlResponse": result
            })
        else:
            return jsonify({
                "success": False,
                "error": "Unexpected GraphQL response format",
                "details": result
            }), 500
            
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error in GraphQL 3DS lookup: {str(e)}")
        try:
            error_details = e.response.json()
            return jsonify({
                "success": False,
                "error": "GraphQL request failed",
                "details": error_details
            }), e.response.status_code
        except:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    except Exception as e:
        print(f"Error in GraphQL 3DS lookup: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/charge-payment-graphql", methods=["POST"])
def api_charge_payment_graphql():
    """Process payment using Braintree GraphQL API.
    
    Request body:
    {
        "nonce": "3ds_verified_nonce",
        "amount": "10.00",
        "deviceData": "device_data_from_collector",
        "orderId": "ORDER-123"
    }
    """
    try:
        data = request.json
        
        nonce = data.get("nonce")
        amount = data.get("amount")
        device_data = data.get("deviceData")
        order_id = data.get("orderId")
        
        if not nonce or not amount:
            return jsonify({
                "success": False,
                "error": "Missing required fields: nonce and amount"
            }), 400
        
        # Build GraphQL mutation for charge
        graphql_mutation = """
            mutation ChargePaymentMethod($input: ChargePaymentMethodInput!) {
                chargePaymentMethod(input: $input) {
                    transaction {
                        id
                        legacyId
                        createdAt
                        amount {
                            value
                            currencyIsoCode
                        }
                        orderId
                        status
                        statusHistory {
                            status
                            timestamp
                        }
                        merchantAccountId
                        paymentMethodSnapshot {
                            ... on CreditCardDetails {
                                brandCode
                                last4
                                cardholderName
                            }
                        }
                    }
                }
            }
        """
        
        # Build charge input
        charge_input = {
            "paymentMethodId": nonce,
            "transaction": {
                "amount": str(amount)
            },
            "options": {
                "submitForSettlement": True
            }
        }
        
        if order_id:
            charge_input["transaction"]["orderId"] = order_id
        
        if device_data:
            charge_input["transaction"]["riskData"] = {
                "deviceData": device_data
            }
        
        variables = {
            "input": charge_input
        }
        
        print("GraphQL payment request:", {
            "nonce": nonce[:10] + "...",
            "amount": amount,
            "orderId": order_id
        })
        
        # Get client token for authorization
        client_token = getClientToken()
        
        # Make GraphQL request
        graphql_url = "https://payments.sandbox.braintree-api.com/graphql"
        
        graphql_response = requests.post(
            graphql_url,
            headers={
                "Authorization": f"Bearer {client_token}",
                "Braintree-Version": "2021-02-01",
                "Content-Type": "application/json"
            },
            json={
                "query": graphql_mutation,
                "variables": variables
            }
        )
        
        graphql_response.raise_for_status()
        result = graphql_response.json()
        
        print("GraphQL Payment Response received")
        
        # Check for GraphQL errors
        if "errors" in result:
            error_messages = []
            for error in result["errors"]:
                error_messages.append(error.get("message", "Unknown error"))
            
            return jsonify({
                "success": False,
                "error": "; ".join(error_messages),
                "details": result["errors"]
            }), 400
        
        # Extract transaction data
        if "data" in result and "chargePaymentMethod" in result["data"]:
            transaction = result["data"]["chargePaymentMethod"]["transaction"]
            
            # Format payment method info
            payment_method_info = {}
            snapshot = transaction.get("paymentMethodSnapshot")
            if snapshot and "brandCode" in snapshot:
                payment_method_info = {
                    "brand": snapshot.get("brandCode"),
                    "last4": snapshot.get("last4"),
                    "cardholderName": snapshot.get("cardholderName")
                }
            
            return jsonify({
                "success": True,
                "transactionId": transaction["id"],
                "legacyId": transaction.get("legacyId"),
                "amount": transaction["amount"]["value"],
                "currency": transaction["amount"]["currencyIsoCode"],
                "status": transaction["status"],
                "orderId": transaction.get("orderId"),
                "createdAt": transaction.get("createdAt"),
                "paymentMethod": payment_method_info,
                "graphqlResponse": result
            })
        else:
            return jsonify({
                "success": False,
                "error": "Unexpected GraphQL response format",
                "details": result
            }), 500
            
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error in GraphQL payment: {str(e)}")
        try:
            error_details = e.response.json()
            return jsonify({
                "success": False,
                "error": "GraphQL request failed",
                "details": error_details
            }), e.response.status_code
        except:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    except Exception as e:
        print(f"Error in GraphQL payment: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/transactions-graphql", methods=["GET"])
def api_get_transactions_graphql():
    """Get transaction list using Braintree GraphQL API.
    Query params:
    - first: number of transactions to retrieve (default 10, max 100)
    - status: filter by status (e.g., SETTLED, AUTHORIZED)
    - customerId: filter by customer ID
    """
    try:
        # Get query parameters
        first = min(int(request.args.get("first", 10)), 100)  # Max 100 per request
        status = request.args.get("status")
        customer_id = request.args.get("customerId")
        
        # Build GraphQL query
        graphql_query = """
            query SearchTransactions($input: TransactionSearchInput!, $first: Int!) {
                search {
                    transactions(input: $input, first: $first) {
                        edges {
                            node {
                                id
                                legacyId
                                createdAt
                                amount {
                                    value
                                    currencyIsoCode
                                }
                                orderId
                                status
                                merchantAccountId
                                paymentMethodSnapshot {
                                    ... on CreditCardDetails {
                                        brandCode
                                        last4
                                        cardholderName
                                    }
                                    ... on PayPalTransactionDetails {
                                        payer {
                                            email
                                            firstName
                                            lastName
                                        }
                                    }
                                }
                                statusHistory {
                                    status
                                    timestamp
                                    amount {
                                        value
                                    }
                                }
                            }
                            cursor
                        }
                        pageInfo {
                            hasNextPage
                            hasPreviousPage
                        }
                    }
                }
            }
        """
        
        # Build search input
        search_input = {}
        
        if status:
            search_input["status"] = {"is": status}
        
        if customer_id:
            search_input["customerId"] = {"is": customer_id}
        
        variables = {
            "input": search_input if search_input else {},
            "first": first
        }
        
        # Log request
        print("GraphQL transaction search request:", {
            "first": first,
            "filters": search_input
        })
        
        # Get client token for authorization
        client_token = getClientToken()
        
        # Make GraphQL request to Braintree
        graphql_url = "https://payments.sandbox.braintree-api.com/graphql"
        
        graphql_response = requests.post(
            graphql_url,
            headers={
                "Authorization": f"Bearer {client_token}",
                "Braintree-Version": "2021-02-01",
                "Content-Type": "application/json"
            },
            json={
                "query": graphql_query,
                "variables": variables
            }
        )
        
        graphql_response.raise_for_status()
        result = graphql_response.json()
        
        print("GraphQL Response received")
        
        # Check for GraphQL errors
        if "errors" in result:
            error_messages = []
            for error in result["errors"]:
                error_messages.append(error.get("message", "Unknown error"))
            
            return jsonify({
                "success": False,
                "error": "; ".join(error_messages),
                "details": result["errors"]
            }), 400
        
        # Extract transaction data
        if "data" in result and "search" in result["data"]:
            search_data = result["data"]["search"]
            transactions = search_data["transactions"]
            
            # Format transactions for easier consumption
            formatted_transactions = []
            for edge in transactions["edges"]:
                node = edge["node"]
                
                # Extract payment method info
                payment_method_info = {}
                snapshot = node.get("paymentMethodSnapshot")
                if snapshot:
                    if "brandCode" in snapshot:  # Credit card
                        payment_method_info = {
                            "type": "credit_card",
                            "brand": snapshot.get("brandCode"),
                            "last4": snapshot.get("last4"),
                            "cardholderName": snapshot.get("cardholderName")
                        }
                    elif "payer" in snapshot:  # PayPal
                        payer = snapshot["payer"]
                        payment_method_info = {
                            "type": "paypal",
                            "email": payer.get("email"),
                            "name": f"{payer.get('firstName', '')} {payer.get('lastName', '')}".strip()
                        }
                
                formatted_transactions.append({
                    "id": node["id"],
                    "legacyId": node.get("legacyId"),
                    "createdAt": node.get("createdAt"),
                    "amount": node["amount"]["value"],
                    "currency": node["amount"]["currencyIsoCode"],
                    "orderId": node.get("orderId"),
                    "status": node["status"],
                    "merchantAccountId": node.get("merchantAccountId"),
                    "paymentMethod": payment_method_info,
                    "statusHistoryCount": len(node.get("statusHistory", []))
                })
            
            return jsonify({
                "success": True,
                "transactions": formatted_transactions,
                "count": len(formatted_transactions),
                "pageInfo": transactions["pageInfo"],
                "graphqlResponse": result
            })
        else:
            return jsonify({
                "success": False,
                "error": "Unexpected GraphQL response format",
                "details": result
            }), 500
            
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error in GraphQL transaction search: {str(e)}")
        try:
            error_details = e.response.json()
            return jsonify({
                "success": False,
                "error": "GraphQL request failed",
                "details": error_details
            }), e.response.status_code
        except:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
    except Exception as e:
        print(f"Error in GraphQL transaction search: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


def build_playground_sale_request(amount, nonce, merchant_account_id=None, submit_for_settlement=True, device_data=None, order_id=None):
    """Build a transaction.sale request payload for playground endpoints.
    Keeps existing helpers untouched; allows overriding merchant account and settlement option.
    """
    req = {
        "amount": str(amount),
        "payment_method_nonce": nonce,
        "merchant_account_id": merchant_account_id or PROCESSING_MAID,
        "order_id": order_id or str(uuid.uuid1()),
        "options": {
            "submit_for_settlement": bool(submit_for_settlement)
        }
        ,
        "custom_fields": {
            "customfield_storeandpassbackfield": "customfield_storeandpassbackfield txn.sale",
            "customfield_pass_thru": "customfield_pass_thru txn.sale"
        }
    }
    if device_data:
        req["device_data"] = device_data
    return req

def build_playground_subscription_request(plan_id, nonce, merchant_account_id=None):
    req = {
        "plan_id": plan_id,
        "payment_method_nonce": nonce,
        "id": "merchantDefinedSubscriptionID_" + str(uuid.uuid1()), # without this, bt system auto gen
        "merchant_account_id": merchant_account_id or PROCESSING_MAID
        # "options": {
        #     "do_not_inherit_add_ons_or_discounts": bool  
        # },
        #no custom field / device data supports
    }
    return req
    


@app.route("/api/payments/google-pay/subscription", methods=["POST"])
def api_google_pay_subscription():
    data = request.get_json() or {}
    print("Received JSON:", data)  # Print the whole payload
    nonce = data.get("paymentMethodNonce")
    merchant_account_id = data.get("merchantAccountId")
    plan_id = DEFAULT_PLAN_ID
    
    subscription_req = build_playground_subscription_request(
        plan_id=plan_id,
        nonce=nonce,
        merchant_account_id=merchant_account_id                
    )

    result = gateway.subscription.create(subscription_req)
    printBTResponse(result)
    if result.is_success:
        return jsonify({
            "success": True,
            "transaction_id": result.transaction.id,
            "transaction_status": result.transaction.status,
            "order_id": result.transaction.order_id,
            "amount": str(result.transaction.amount),
            "merchant_account_id": result.transaction.merchant_account_id,
            "processor_response_text": result.transaction.processor_response_text,
            "processor_response_code": result.transaction.processor_response_code
        })
    else:
        return jsonify({
            "success": False,
            "error_message": "Failed to create subscription. Check api_google_pay_subscription"
        }), 400

@app.route("/api/payments/google-pay/transaction", methods=["POST"])
def api_google_pay_transaction():
    """Create a sale transaction using a Google Pay nonce.
    Used by: templates/googlepay.html
    Body: { paymentMethodNonce, amount, currency (informational), submitForSettlement, merchantAccountId, deviceData }
    Note: currency derives from the merchant account; provided currency is logged for demo but not sent.
    """
    data = request.get_json() or {}
    print("Received JSON:", data)  # Print the whole payload
    nonce = data.get("paymentMethodNonce")
    amount = data.get("amount")
    merchant_account_id = data.get("merchantAccountId")
    submit_for_settlement = data.get("submitForSettlement", True)
    device_data = data.get("deviceData")

    if not nonce or not amount:
        return jsonify({
            "success": False,
            "error_type": "validation",
            "error_message": "paymentMethodNonce and amount are required"
        }), 400

    sale_req = build_playground_sale_request(
        amount=amount,
        nonce=nonce,
        merchant_account_id=merchant_account_id,
        submit_for_settlement=submit_for_settlement,
        device_data=device_data
    )

    result = gateway.transaction.sale(sale_req)
    printBTResponse(result)
    if result.is_success:
        return jsonify({
            "success": True,
            "transaction_id": result.transaction.id,
            "transaction_status": result.transaction.status,
            "order_id": result.transaction.order_id,
            "amount": str(result.transaction.amount),
            "merchant_account_id": result.transaction.merchant_account_id,
            "processor_response_text": result.transaction.processor_response_text,
            "processor_response_code": result.transaction.processor_response_code
        })
    elif hasattr(result, 'transaction') and result.transaction:
        return jsonify({
            "success": False,
            "transaction_id": result.transaction.id,
            "order_id": result.transaction.order_id,
            "transaction_status": result.transaction.status,
            "transaction_gateway_rejection_reason": result.transaction.gateway_rejection_reason,
            "merchant_account_id": result.transaction.merchant_account_id,
            
            "merchant_advice_code": result.transaction.merchant_advice_code,
            "merchant_advice_code_text": result.transaction.merchant_advice_code_text,
            "processor_response_text": result.transaction.processor_response_text,
            "processor_response_code": result.transaction.processor_response_code
        }), 422
    else:
        error_messages = [f"{x.code}: {x.message}" for x in result.errors.deep_errors]
        return jsonify({
            "success": False,
            "error_type": "validation",
            "error_message": "; ".join(error_messages)
        }), 422


@app.route("/api/payments/lpm/start", methods=["POST"])
def api_lpm_start():
    """Local Payment Methods start hook (logging/validation).
    Used by: templates/local_payments.html
    """
    data = request.get_json() or {}
    print("LPM start payload:", data)
    return jsonify({ "success": True })


@app.route("/api/payments/lpm/transaction", methods=["POST"])
def api_lpm_transaction():
    """Create a sale using a nonce from an instant Local Payment Method.
    Used by: templates/local_payments.html
    Body: { paymentMethodNonce, amount, submitForSettlement, merchantAccountId }
    """
    data = request.get_json() or {}
    nonce = data.get("paymentMethodNonce")
    amount = data.get("amount")
    merchant_account_id = data.get("merchantAccountId")
    submit_for_settlement = data.get("submitForSettlement", True)
    if not nonce or not amount:
        return jsonify({ "success": False, "error_type": "validation", "error_message": "paymentMethodNonce and amount are required" }), 400

    sale_req = build_playground_sale_request(amount=amount, nonce=nonce, merchant_account_id=merchant_account_id, submit_for_settlement=submit_for_settlement)
    result = gateway.transaction.sale(sale_req)
    printBTResponse(result)
    if result.is_success:
        return jsonify({
            "success": True,
            "transaction_id": result.transaction.id,
            "transaction_status": result.transaction.status,
            "order_id": result.transaction.order_id,
            "amount": str(result.transaction.amount)
        })
    elif hasattr(result, 'transaction') and result.transaction:
        return jsonify({
            "success": False,
            "order_id": result.transaction.order_id,
            "error_message": result.transaction.processor_response_text,
            "error_code": result.transaction.processor_response_code
        }), 422
    else:
        error_messages = [f"{x.code}: {x.message}" for x in result.errors.deep_errors]
        return jsonify({ "success": False, "error_type": "validation", "error_message": "; ".join(error_messages) }), 422

@app.route("/api/appswitch/orders/<order_id>", methods=["GET"])
def api_appswitch_get_order(order_id):
    active_order = findActiveOrder(order_id)
    if not active_order:
        return jsonify({ "success": False, "error_type": "validation", "error_message": "Invalid order ID" }), 400

    return jsonify({
        "success": True,
        "order": active_order
    })


@app.route("/api/payments/paypal/checkout_appswitch", methods=["POST"])
def api_paypal_checkout_appswitch():
    data = request.get_json() or {}
    print("PayPal Checkout App Switch payload:", data)
    nonce = data.get("paymentMethodNonce")
    store_in_vault = data.get("storeInVaultOnSuccess", False)
    device_data = data.get("isDeviceDataRequired")

    #findActiveOrder
    active_order = findActiveOrder(data.get("orderId"))
    if not active_order:
        return jsonify({ "success": False, "error_type": "validation", "error_message": "Invalid order ID" }), 400

    if not matchActiveOrderStatus(active_order.get("id"), "open"):
        return jsonify({ "success": False, "error_type": "validation", "error_message": "Order already processed" }), 400

    amount = active_order.get("amount")
    order_id = active_order.get("id")
    merchant_account_id = active_order.get("merchantAccountId")

    #if intent is capture, then submitForSettlement is true, else False
    submit_for_settlement = False
    if active_order.get("intent") == "capture":
        submit_for_settlement = True
    
    if not nonce or not amount:
        return jsonify({ "success": False, "error_type": "validation", "error_message": "paymentMethodNonce and amount are required" }), 400

    sale_req = build_playground_sale_request(amount=amount, nonce=nonce, merchant_account_id=merchant_account_id, submit_for_settlement=submit_for_settlement, device_data=device_data, order_id=order_id)
    if store_in_vault:
        sale_req.setdefault("options", {})["store_in_vault_on_success"] = True
    result = gateway.transaction.sale(sale_req)
    isTransactionSale = True
    printBTResponse(result, isTransactionSale)
    if result.is_success:
        updateActiveOrderStatus(order_id, result.transaction.status)

        return jsonify({
            "success": True,
            "transaction_id": result.transaction.id,
            "transaction_status": result.transaction.status,
            "order_id": result.transaction.order_id,
            "amount": str(result.transaction.amount)
        })
    elif hasattr(result, 'transaction') and result.transaction:
        return jsonify({
            "success": False,
            "order_id": result.transaction.order_id,
            "error_message": result.transaction.processor_response_text,
            "error_code": result.transaction.processor_response_code
        }), 422
    else:
        error_messages = [f"{x.code}: {x.message}" for x in result.errors.deep_errors]
        return jsonify({ "success": False, "error_type": "validation", "error_message": "; ".join(error_messages) }), 422



@app.route("/api/payments/paypal/checkout", methods=["POST"])
def api_paypal_checkout():
    """One-time PayPal checkout: create transaction from nonce.
    Used by: templates/paypal.html
    Body: { paymentMethodNonce, amount, submitForSettlement, merchantAccountId, storeInVaultOnSuccess }
    """
    data = request.get_json() or {}
    nonce = data.get("paymentMethodNonce")
    amount = data.get("amount")
    merchant_account_id = data.get("merchantAccountId")
    submit_for_settlement = data.get("submitForSettlement", True)
    store_in_vault = data.get("storeInVaultOnSuccess", False)
    device_data = data.get("deviceData")
    order_id = data.get("orderId")

    if not nonce or not amount:
        return jsonify({ "success": False, "error_type": "validation", "error_message": "paymentMethodNonce and amount are required" }), 400

    sale_req = build_playground_sale_request(amount=amount, nonce=nonce, merchant_account_id=merchant_account_id, submit_for_settlement=submit_for_settlement, device_data=device_data, order_id=order_id)
    if store_in_vault:
        sale_req.setdefault("options", {})["store_in_vault_on_success"] = True
    result = gateway.transaction.sale(sale_req)
    printBTResponse(result)
    if result.is_success:
        return jsonify({
            "success": True,
            "transaction_id": result.transaction.id,
            "transaction_status": result.transaction.status,
            "order_id": result.transaction.order_id,
            "amount": str(result.transaction.amount)
        })
    elif hasattr(result, 'transaction') and result.transaction:
        return jsonify({
            "success": False,
            "order_id": result.transaction.order_id,
            "error_message": result.transaction.processor_response_text,
            "error_code": result.transaction.processor_response_code
        }), 422
    else:
        error_messages = [f"{x.code}: {x.message}" for x in result.errors.deep_errors]
        return jsonify({ "success": False, "error_type": "validation", "error_message": "; ".join(error_messages) }), 422


@app.route("/api/payments/paypal/vault", methods=["POST"])
def api_paypal_vault():
    """Vault-only PayPal flow placeholder.
    Used by: templates/paypal.html
    Note: Full server-side vault exchange is context dependent; for demo, echo success.
    """
    data = request.get_json() or {}
    # In a full implementation you would exchange a billing agreement/BA token.
    return jsonify({ "success": True, "note": "Vault demo placeholder", "payload": data })


@app.route("/api/payments/paypal/checkout-with-vault", methods=["POST"])
def api_paypal_checkout_with_vault():
    """Checkout + Vault convenience wrapper.
    Used by: templates/paypal.html
    """
    data = request.get_json() or {}
    data["storeInVaultOnSuccess"] = True
    with app.test_request_context(json=data):
        return api_paypal_checkout()


@app.route("/api/payments/paypal/recurring-setup", methods=["POST"])
def api_paypal_recurring_setup():
    """Recurring setup placeholder endpoint.
    Used by: templates/paypal.html
    """
    data = request.get_json() or {}
    return jsonify({ "success": True, "note": "Recurring setup demo placeholder", "payload": data })




@app.route("/createPMT", methods=["POST"])
def createPMT():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    nonce_from_the_client = data["payment_method_nonce"]
    customerId = data.get("customerId")  # Safe access
    merchantAccountId = data.get("merchantAccountId")  # Safe access
    
    return createPaymentMethod(customerId, nonce_from_the_client, merchantAccountId)

def createPaymentMethod(customerId, pmt_nonce, merchantAccountId=None):
    result = gateway.payment_method.create({
        "customer_id": customerId,
        "payment_method_nonce": pmt_nonce,
        "options": {
            "verification_merchant_account_id": merchantAccountId or PROCESSING_MAID, #if merchantAccountId is None, use default
        } 
    })

    printBTResponse(result)
    if result.is_success:
        print("PMT created successfully:")
        return jsonify({
            "success": True
        })
    else:
        print("PMT creation error:")
        error_messages = []
        for x in result.errors.deep_errors: 
            print("  Error Attribute: {}, Error Code: {}, Error Message: {}".format(x.attribute, x.code, x.message))
            error_messages.append(x.message)
        return jsonify({
            "success": False,
            "error_message": "; ".join(error_messages),
            "error_type": "PMT creation error"
        })


def decode_base64(encoded_string):
    """
    Decode a base64 encoded string.
    
    Args:
        encoded_string (str): Base64 encoded string to decode
        
    Returns:
        str: Decoded string
        
    Raises:
        Exception: If decoding fails
    """
    try:
        decoded_bytes = base64.b64decode(encoded_string)
        decoded_string = decoded_bytes.decode('utf-8')

        # Detect if it is JSON, if yes, pretty print it
        try:
            json_data = json.loads(decoded_string)
            print("Decoded JSON:", json.dumps(json_data, indent=2))
        except json.JSONDecodeError:
            print("Decoded string:", decoded_string)
        return decoded_string
    except Exception as e:
        raise Exception(f"Failed to decode base64 string: {e}")

def safe_to_dict(obj):
    # Handle objects with to_dict method
    if hasattr(obj, "to_dict"):
        return {k: safe_to_dict(v) for k, v in obj.to_dict().items()}
    # Handle dicts
    elif isinstance(obj, dict):
        return {k: safe_to_dict(v) for k, v in obj.items()}
    # Handle lists/tuples
    elif isinstance(obj, (list, tuple)):
        return [safe_to_dict(v) for v in obj]
    # Handle objects with __dict__ (most Python objects)
    # elif hasattr(obj, "__dict__"):
    #     # Avoid printing private/protected attributes and methods
    #     return {k: safe_to_dict(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    # Primitive types
    else:
        return obj

def printBTResponse(result, isTransactionSale=False):
    if isTransactionSale:
        print("Transaction Sale Response:")
        parsedData=safe_to_dict(result.transaction)
        print(json.dumps(parsedData, indent=2, default=str))
        if result.transaction.payment_instrument_type == braintree.PaymentInstrumentType.PayPalAccount:
            print(json.dumps(result.transaction.paypal, indent=2, default=str))
        elif result.transaction.payment_instrument_type == braintree.PaymentInstrumentType.CreditCard:
            print(json.dumps(result.transaction.credit_card, indent=2, default=str))
    else:
        print("Braintree Response:")
        parsedData=safe_to_dict(result)
        print(json.dumps(parsedData, indent=2, default=str))

@app.route("/createPayment", methods=["POST"])
def createPayment():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    nonce_from_the_client = data["payment_method_nonce"]
    amount = data["amount"]
    customerId = data.get("customerId")  # Safe access
    storeInVault = data.get("serverVaultOnSuccess")  # Safe access
    pmtToken = data.get("pmtToken")
    deviceData = data.get("device_data")
    return createTransaction(nonce_from_the_client, amount, customerId, storeInVault, pmtToken, deviceData)

def createTransaction(nonce_from_the_client, amount, customerId=None, storeInVault=False, pmtToken=None, deviceData=None ):
    tranReq = transactionSaleRequest(nonce_from_the_client, amount, customerId, storeInVault, pmtToken, deviceData)
    orderId = tranReq["order_id"]
    result = gateway.transaction.sale(tranReq)
    printBTResponse(result)
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

def transactionSaleRequest(nonce_from_the_client, amount, customerId=None, storeInVault=False, pmtToken=None, deviceData=None):
    baseOb = {
        "amount": amount,
        "payment_method_nonce": nonce_from_the_client,
        "merchant_account_id": PROCESSING_MAID,
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


    if deviceData is not None:
        baseOb["device_data"] = deviceData

    print ("Transaction request obj: ")
    print (baseOb)
    return baseOb


@app.route("/checkouts/<transaction_id>", methods=["GET"])
def showSuccessfulTransaction(transaction_id):
    transaction = gateway.transaction.find(transaction_id) 
    print (transaction)
    return render_template("paymentResultPage.html", transaction=transaction, isSuccess=True, orderId=transaction.order_id)

@app.route("/order/<order_id>", methods=["GET"])
def btTransactionSearchByOrderId(order_id):
    search_results = gateway.transaction.search(
        braintree.TransactionSearch.order_id == order_id

    )
    if search_results:
        transaction = search_results[0]
        print (transaction)
        return render_template("paymentResultPage.html", transaction=transaction, isSuccess=True, orderId=transaction.order_id)
    else:
        print("No transaction found for order_id: {}".format(order_id))
        return render_template("paymentResultPage.html", orderId=order_id, isSuccess=False)


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



def webhookTesting():
    sample_notification = gateway.webhook_testing.sample_notification(
    braintree.WebhookNotification.Kind.SubscriptionWentPastDue,
    "my_id"
    )
    webhook_notification = gateway.webhook_notification.parse(
        sample_notification['bt_signature'],
        sample_notification['bt_payload']
    )
    #webhook_notification.subscription.id => "my_id"

def manageDisputeTest(txnID):
    delaySeconds = 30
    print("Queue background task - manageDisputeTest - for {} seconds", delaySeconds)
    sleep(delaySeconds)  # Simulate a X-second delay
    print("Running task - manageDisputeTest")
     # printBTResponse(result)
    # Do something with the result.transaction.disputes
    # dispute = gateway.dispute.find(txnID)
    # printBTResponse(dispute)

    result = gateway.dispute.search([
        braintree.DisputeSearch.transaction_id == txnID
    ])
    for dispute in result.disputes.items:
        printBTResponse(dispute)
        addEviResult = gateway.dispute.add_text_evidence(dispute.id, "compelling_evidence")
        printBTResponse(addEviResult)
        finalizeDisputeResult =gateway.dispute.finalize(dispute.id)
        printBTResponse(finalizeDisputeResult)
    print("Async task - manageDisputeTest - completed")





########
# for direct PP test
########
def printPPResponse(res):
    print(json.dumps(res, indent=2, default=str))

@app.route("/pp/fraudnetsample", methods=["GET"])
def pp_fraudnetsample():
    return render_template("fraudnetsample.html", isPatch=False)

@app.route("/pp/fraudnet", methods=["GET"])
def pp_fraudnet():
    return render_template("quickTestPPDirect.html", isPatch=False)

@app.route("/pp/fraudnetstore", methods=["GET"])
def pp_fraudnetStore():
    return render_template("quickTestPPDirectStore.html", isPatch=False)

@app.route("/pp/fraudnetWithPatch", methods=["GET"])
def pp_fraudnet_patch():
    return render_template("quickTestPPDirect.html", isPatch=True)

@app.route("/pp/fraudnetstoreWithPatch", methods=["GET"])
def pp_fraudnetStore_patch():
    return render_template("quickTestPPDirectStore.html", isPatch=True)


@app.route("/pp/fraudnetvauted", methods=["GET"])
def pp_fraudnetVaulted():
    return render_template("quickTestPPDirectVaultedToken.html")

@app.route("/complete_pp_checkout", methods=["GET"])
def completePPCheckout():
    args = request.args
    payerID = request.args.get("PayerID") 
    orderID = request.args.get("token")
    FN_SESSION_ID = request.args.get("f")
    clientToken = post_pp_client_token()

    isPatch = request.args.get("isPatch", "false").lower() == "true"
    print("isPatch: ", isPatch)
    
    
    
    if isPatch:
        patch_pp_order(clientToken, orderID,FN_SESSION_ID)
    response = post_pp_auth_order(clientToken, orderID,FN_SESSION_ID)
    print("Authorization ID: ", response['purchase_units'][0]['payments']['authorizations'][0]['id'])
    response = post_pp_capture_auth(clientToken, response['purchase_units'][0]['payments']['authorizations'][0]['id'],FN_SESSION_ID)
    response = get_pp_order_details(clientToken, orderID)

    return jsonify({
        "success": True,
        "response": response,
        "orderID": orderID
    }) 



@app.route("/authorize_pp_order", methods=["POST"])
def authorize_pp_order():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    #custId = data.get("custId")  # ✅ returns None instead of error if key is not present
    
    #try to retrieve client token from data
    clientId = data.get("client_id")
    clientSecret = data.get("client_secret")
    #remove clientId and clientSecret from data to avoid issues
    data.pop("client_id", None)
    data.pop("client_secret", None)

    orderID = data.get("orderID")

    clientToken = post_pp_client_token(clientId, clientSecret)    
    order_response = post_pp_auth_order(clientToken, orderID)

    return jsonify({
            "success": True,
            "order_response": order_response
        })



def post_pp_auth_order(clientToken, orderID, FN_SESSION_ID = None):
    try:
        url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders/' + orderID +'/authorize'
        payload ={}

        headers = {
            "Authorization": f"Bearer {clientToken}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
#            "PAYPAL-CLIENT-METADATA-ID": FN_SESSION_ID
        }
    
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        printPPResponse(data)
        return data
    except Exception as e:
        raise Exception(f"Failed to capture order: {e}")

def post_pp_capture_auth(clientToken, authID, FN_SESSION_ID):
    try:
        url = 'https://api-m.sandbox.paypal.com/v2/payments/authorizations/' + authID +'/capture'
        
        payload ={}

        headers = {
            "Authorization": f"Bearer {clientToken}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
#            "PAYPAL-CLIENT-METADATA-ID": FN_SESSION_ID
        }
    
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        printPPResponse(data)
        return data
    except Exception as e:
        raise Exception(f"Failed to capture order: {e}")


@app.route("/pp/capture_order", methods=["POST"])
def capture_order():
    data = request.get_json()
    print("Capture Order Req received, data: ", data)  # Print the whole payload
    clientToken = post_pp_client_token()
    orderID = data.get("orderID")
    FN_SESSION_ID = data.get("f")
    response = post_pp_capture_order(clientToken, orderID, FN_SESSION_ID)
    return jsonify(response)

def post_pp_capture_order(clientToken, orderID, FN_SESSION_ID):
    try:
        url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders/' + orderID +'/capture'
        payload ={
        }

        headers = {
            "Authorization": f"Bearer {clientToken}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
            "PAYPAL-CLIENT-METADATA-ID": FN_SESSION_ID
        }
    
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        printPPResponse(data)
        return data
    except Exception as e:
        raise Exception(f"Failed to capture order: {e}")

def patch_pp_order(clientToken, orderID, FN_SESSION_ID):
    try:
        url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders/' + orderID
        payload =[
            {
                "op": "replace",
                "path": "/purchase_units/@reference_id=='d1234567-38f0-1234-1234-0ed123456789'/shipping/address",
                "value": {
                    "address_line_1": "123 Townsend St",
                    "address_line_2": "Floor 6",
                    "admin_area_2": "San Francisco",
                    "admin_area_1": "CA",
                    "postal_code": "94107",
                    "country_code": "US"
                }
            }
        ]

        headers = {
            "Authorization": f"Bearer {clientToken}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
            "PAYPAL-CLIENT-METADATA-ID": FN_SESSION_ID
        }
    
        response = requests.patch(url, headers=headers, json=payload)
        response.raise_for_status()
        return True
    except Exception as e:
        raise Exception(f"Failed to patch order: {e}")

@app.route("/pp/order_details", methods=["GET"])
def order_details():
    orderID = request.args.get("orderID")
    clientToken = post_pp_client_token()
    response = get_pp_order_details(clientToken, orderID)
    return jsonify(response)

def get_pp_order_details(clientToken, orderID):
    try:
        url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders/' + orderID
        payload ={}

        print("Getting order details for orderID: ", orderID, " url: ", url)
        headers = {
            "Authorization": f"Bearer {clientToken}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        response = requests.get(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        printPPResponse(data)
        return data
    except Exception as e:
        raise Exception(f"Failed to get order details: {e}")



@app.route("/create_pp_order_v2_vaultedtoken", methods=["POST"])
def createPPOrderV2VaultedToken():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    #custId = data.get("custId")  # ✅ returns None instead of error if key is not present
    clientToken = post_pp_client_token()    


    
    FN_SESSION_ID = data.get("f")
    vaultOnSuccess = data.get("vaultOnSuccess", False)    
    vaultedToken = data.get("vaultedToken")    
    response = post_pp_create_order(clientToken, FN_SESSION_ID, vaultOnSuccess, vaultedToken)
    orderID = response['id']

    auth_id = response['purchase_units'][0]['payments']['authorizations'][0]['id']

    print("Authorization ID: ", auth_id)
    response = post_pp_capture_auth(clientToken, auth_id,FN_SESSION_ID)
    response = get_pp_order_details(clientToken, orderID)
    
    #put_stc(clientToken, FN_SESSION_ID)
    return jsonify({
            "success": True,
            "response": response
        })

@app.route("/create_pp_order_v2_raw_payload", methods=["POST"])
def createPPOrderV2_Raw_Payload():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    #custId = data.get("custId")  # ✅ returns None instead of error if key is not present
    
    #try to retrieve client token from data
    clientId = data.get("client_id")
    clientSecret = data.get("client_secret")
    #remove clientId and clientSecret from data to avoid issues
    data.pop("client_id", None)
    data.pop("client_secret", None)

    clientToken = post_pp_client_token(clientId, clientSecret)    
    order_response = post_pp_create_order_raw(clientToken, data)

    return jsonify({
            "success": True,
            "order_response": order_response
        })


@app.route("/create_pp_order_v2", methods=["POST"])
def createPPOrderV2():
    data = request.get_json()
    print("Received JSON:", data)  # Print the whole payload
    #custId = data.get("custId")  # ✅ returns None instead of error if key is not present
    clientToken = post_pp_client_token()    
    FN_SESSION_ID = data.get("f")
    vaultOnSuccess = data.get("vaultOnSuccess", False)    
    isPatch = data.get("isPatch", False)
    vaultToken = data.get("vaultedToken", None)    
    order_response = post_pp_create_order(clientToken, FN_SESSION_ID, vaultOnSuccess, vaultToken, isPatch)
    #put_stc(clientToken, FN_SESSION_ID)
    return jsonify({
            "success": True,
            "order_response": order_response
        })

def post_pp_create_order_raw(clientToken, payload):
    try:
        url = 'https://api-m.sandbox.paypal.com' + '/v2/checkout/orders'
        headers = {
            "Authorization": f"Bearer {clientToken}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
            "PayPal-Request-Id": str(uuid.uuid1())
        }
    
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        #if response.status_code == 200:
        print("Create Order HTTP Status:", response.status_code)
        printPPResponse(data)
        return data
    except Exception as e:
        raise Exception(f"Failed to create order: {e}")

def post_pp_create_order(token, FN_SESSION_ID, vaultOnSuccess=False, vaultedToken=None, isPatch=False):
    try:
        url = 'https://api-m.sandbox.paypal.com' + '/v2/checkout/orders'


        print("vaultOnSuccess: ", vaultOnSuccess)
        if vaultedToken is not None:
            vaultedTokenSample = {
                "intent": "AUTHORIZE",
                "purchase_units": [
                    {
                        "reference_id": "d1234567-38f0-1234-1234-0ed123456789",
                        "invoice_id": str(uuid.uuid1()),
                        "amount": {
                            "currency_code": "EUR",
                            "value": "204.00",
                            "breakdown": {
                                "item_total": {
                                    "currency_code": "EUR",
                                    "value": "199.00"
                                },
                                "shipping": {
                                    "currency_code": "EUR",
                                    "value": "5.00"
                                }
                            }
                        },
                        "items": [
                            {
                                "name": "DSLR Lens Cover",
                                "sku": "517293",
                                "unit_amount": {
                                    "currency_code": "EUR",
                                    "value": "199.0"
                                },
                                "tax": {
                                    "currency_code": "EUR",
                                    "value": "0.0"
                                },
                                "quantity": "1",
                                "category": "PHYSICAL_GOODS"
                            }
                        ],
                        "shipping": {
                            "name": {
                                "full_name": "Frank Geller",
                                "shipping_type": "SHIPPING"
                            },
                            "address": {
                                "address_line_1": "4668-xxxx",
                                "admin_area_2": "Brownsville",
                                "admin_area_1": "TX",
                                "postal_code": "785-xxxx",
                                "country_code": "US"
                            }
                        }
                    }
                ],
                "payment_source": {
                    "paypal": {
                        "vault_id": vaultedToken,
                        "experience_context": {
                            "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                            "shipping_preference": "SET_PROVIDED_ADDRESS",
                            "user_action": "PAY_NOW",
                             "return_url": "https://bt-2025.onrender.com/complete_pp_checkout?vaultedtoken=" + vaultedToken + "&f=" + FN_SESSION_ID,
                             "cancel_url": "https://bt-2025.onrender.com/complete_pp_checkout?vaultedtoken=" + vaultedToken + "&f=" + FN_SESSION_ID

                            #"return_url": "http://127.0.0.1:5000/complete_pp_checkout?vaultedtoken=" + vaultedToken + "&f=" + FN_SESSION_ID,
                            #"cancel_url": "http://127.0.0.1:5000/complete_pp_checkout?vaultedtoken=" + vaultedToken + "&f=" + FN_SESSION_ID
                        }
                    }
                }
            }

            payload = vaultedTokenSample
        elif vaultOnSuccess:
            vaultOnSucessSample = {
                "intent": "AUTHORIZE",
                "purchase_units": [
                    {
                        "reference_id": "d1234567-38f0-1234-1234-0ed123456789",
                        "invoice_id": str(uuid.uuid1()),
                        "amount": {
                            "currency_code": "EUR",
                            "value": "204.00",
                            "breakdown": {
                                "item_total": {
                                    "currency_code": "EUR",
                                    "value": "199.00"
                                },
                                "shipping": {
                                    "currency_code": "EUR",
                                    "value": "5.00"
                                }
                            }
                        },
                        "items": [
                            {
                                "name": "DSLR Lens Cover",
                                "sku": "517293",
                                "unit_amount": {
                                    "currency_code": "EUR",
                                    "value": "199.0"
                                },
                                "tax": {
                                    "currency_code": "EUR",
                                    "value": "0.0"
                                },
                                "quantity": "1",
                                "category": "PHYSICAL_GOODS"
                            }
                        ],
                        "shipping": {
                            "name": {
                                "full_name": "Frank Geller",
                                "shipping_type": "SHIPPING"
                            },
                            "address": {
                                "address_line_1": "4668-xxxx",
                                "admin_area_2": "Brownsville",
                                "admin_area_1": "TX",
                                "postal_code": "785-xxxx",
                                "country_code": "US"
                            }
                        }
                    }
                ],
                "payment_source": {
                    "paypal": {
                        "attributes": {
                            "vault": {
                                "permit_multiple_payment_tokens": "false",
                                "store_in_vault": "ON_SUCCESS",
                                "usage_type": "MERCHANT",
                                "customer_type": "CONSUMER"
                            }
                        },
                        "experience_context": {
                            "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                            "landing_page": "LOGIN",
                            "shipping_preference": "SET_PROVIDED_ADDRESS",
                            "user_action": "PAY_NOW",
                             "return_url": "https://bt-2025.onrender.com/complete_pp_checkout?isPatch=" + isPatch + "&f=" + FN_SESSION_ID,
                             "cancel_url": "https://bt-2025.onrender.com/complete_pp_checkout?isPatch=" + isPatch + "&f=" + FN_SESSION_ID,

                            #"return_url": "http://127.0.0.1:5000/complete_pp_checkout?isPatch=" + isPatch + "&f=" + FN_SESSION_ID,
                            #"cancel_url": "http://127.0.0.1:5000/complete_pp_checkout?isPatch=" + isPatch + "&f=" + FN_SESSION_ID,
                        
                        }
                    }
                }
            }
            payload = vaultOnSucessSample
        else:
            oneTimeSample = {
                "intent": "AUTHORIZE",
                "purchase_units": [
                    {
                        "reference_id": "d1234567-38f0-1234-1234-0ed123456789",
                        "invoice_id": str(uuid.uuid1()),
                        "amount": {
                            "currency_code": "EUR",
                            "value": "204.00",
                            "breakdown": {
                                "item_total": {
                                    "currency_code": "EUR",
                                    "value": "199.00"
                                },
                                "shipping": {
                                    "currency_code": "EUR",
                                    "value": "5.00"
                                }
                            }
                        },
                        "items": [
                            {
                                "name": "DSLR Lens Cover",
                                "sku": "517293",
                                "unit_amount": {
                                    "currency_code": "EUR",
                                    "value": "199.0"
                                },
                                "tax": {
                                    "currency_code": "EUR",
                                    "value": "0.0"
                                },
                                "quantity": "1",
                                "category": "PHYSICAL_GOODS"
                            }
                        ],
                        "shipping": {
                            "name": {
                                "full_name": "Frank Geller",
                                "shipping_type": "SHIPPING"
                            },
                            "address": {
                                "address_line_1": "4668-xxxx",
                                "admin_area_2": "Brownsville",
                                "admin_area_1": "TX",
                                "postal_code": "785-xxxx",
                                "country_code": "US"
                            }
                        }
                    }
                ],
                "payment_source": {
                    "paypal": {
                        "experience_context": {
                            "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                            "landing_page": "LOGIN",
                            "shipping_preference": "SET_PROVIDED_ADDRESS",
                            "user_action": "PAY_NOW",
                            "return_url": "https://bt-2025.onrender.com/complete_pp_checkout?isPatch=" + isPatch + "&f=" + FN_SESSION_ID,
                            "cancel_url": "https://bt-2025.onrender.com/complete_pp_checkout?isPatch=" + isPatch + "&f=" + FN_SESSION_ID,
                        
                            # "return_url": "http://127.0.0.1:5000/complete_pp_checkout?isPatch=" + isPatch + "&f=" + FN_SESSION_ID,
                            # "cancel_url": "http://127.0.0.1:5000/complete_pp_checkout?isPatch=" + isPatch + "&f=" + FN_SESSION_ID,
                        
                        }
                    }
                }
            }

            payload = oneTimeSample


        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
            "PayPal-Request-Id": str(uuid.uuid1()),
            "PAYPAL-CLIENT-METADATA-ID": FN_SESSION_ID
        }
    
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        #if response.status_code == 200:
        print("Create Order HTTP Status:", response.status_code)
        printPPResponse(data)
        return data
    except Exception as e:
        raise Exception(f"Failed to create order: {e}")

@app.route("/getPPClientToken", methods=["GET"])
def get_pp_client_token():
    credential = PP_CREDENTIALS.FOR_FLASK
    print(credential)
    username = credential["client_id"]
    password = credential["client_secret"]

    token = post_pp_client_token(username, password)
    return jsonify({"token": token})

@app.route("/create-internal-order", methods=["POST"])
def create_internal_order():
    data = request.json
    print("Creating internal order with data: ", data)
    active_orders.append(data)

    # Here you would typically process the order creation
    return jsonify({"status": "success", "internal_order_details": data, "active_orders": active_orders})

def findActiveOrder(order_id):
    for order in active_orders:
        if order.get("id") == order_id:
            return order
    return None

def removeActiveOrder(order_id):
    global active_orders
    active_orders = [order for order in active_orders if order.get("id") != order_id]

def updateActiveOrderStatus(order_id, new_status):
    order = findActiveOrder(order_id)    
    if order:
        order["status"] = new_status
        return True
    return False

def matchActiveOrderStatus(order_id, expected_status):
    order = findActiveOrder(order_id)
    if order:
        return order.get("status") == expected_status

    return False




def post_pp_client_token(username=None, password=None):
    """
    GET client token by POST request with Basic Auth.

    Args:
        url (str): The endpoint URL to get the token.
        username (str): Basic Auth username.
        password (str): Basic Auth password.

    Returns:
        str: The access token from the response JSON.

    Raises:
        Exception: If request fails or access token is missing.
    """
    try:
        if username is None or password is None:
            username = PP_CREDENTIALS.FOR_FLASK.value["username"]
            password = PP_CREDENTIALS.FOR_FLASK.value["password"]
        url = 'https://api-m.sandbox.paypal.com' + '/v1/oauth2/token'
        username=username  #client id
        password=password  #client secret
        print("Getting client token with username: ", username)
        payload ={
            "grant_type": "client_credentials"
        }
        response = requests.post(url, auth=HTTPBasicAuth(username, password), data=payload)
        response.raise_for_status()
        data = response.json()
        access_token = data.get("access_token")
        if not access_token:
            raise Exception("access_token not found in response")
        return access_token
    except Exception as e:
        raise Exception(f"Failed to get client token: {e}")

def put_stc(token, unique_session_or_orderId):
    """
    Send HTTP PUT request with Bearer Token authentication.

    Args:
        url (str): The endpoint URL for the PUT request.
        token (str): Bearer access token string.
        data (dict): Data payload to send as JSON.

    Returns:
        dict: Parsed JSON response.

    Raises:
        Exception: If request fails or response is not valid JSON.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    

    try:
        url = 'https://api-m.sandbox.paypal.com' + '/v1/risk/transaction-contexts/' + 'MDBXQWUTS7Y9E/' + unique_session_or_orderId
        
        payload ={
            "additional_data": [
                {
                "key": "sender_account_id",
                "value": "A12345N343"
                },
                {
                "key": "sender_first_name",
                "value": "Steven"
                },
                {
                "key": "sender_last_name",
                "value": "Chong"
                },
                {
                "key": "sender_email",
                "value": "leachong@paypal.com"
                },
                {
                "key": "sender_phone",
                "value": "97123456"
                },
                {
                "key": "sender_country_code",
                "value": "US"
                },
                {
                "key": "sender_create_date",
                "value": "2024-12-09T19:14:55.277-0:00"
                },
                {
                "key": "dg_delivery_method",
                "value": "email"
                },
                {
                "key": "highrisk_txn_flag",
                "value": "0"
                },
                {
                "key": "vertical",
                "value": "Retail"
                }
            ]
        }
        response = requests.put(url, headers=headers, json=payload)
        if response.status_code == 200:
            print("PUT STC Request was successful. Status code is 200.")
        response.raise_for_status()
        return True
    except Exception as e:
        raise Exception(f"Failed to send PUT request: {e}")

########

def send_pp_payout(clientToken, currency, amount, payout_receiver_email_list):
    try:
        url = 'https://api-m.sandbox.paypal.com' + '/v1/payments/payouts'
        
        headers = {
            "Authorization": f"Bearer {clientToken}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "items": [],
            "sender_batch_header": {
                "sender_batch_id": str(uuid.uuid1()),
                "recipient_type": "EMAIL",
                "email_subject": "You have a payout!",
                "email_message": "You have received a payout!"
            }
        }

        for payout_receiver_email in payout_receiver_email_list:
            item = {
                "amount": {
                    "value": amount,
                    # Optional: To send a payout in a different currency, set the currency parameter to the payment's currency code. 
                    # You'll need to make a separate API call for each currency type. 
                    # PayPal can automatically exchange payments for some currencies,
                    #  even when you don't hold a balance in that currency.
                    "currency": currency
                },
                "sender_item_id": str(uuid.uuid1()),
                "recipient_wallet": "PAYPAL",
                "receiver": payout_receiver_email
            }

            payload["items"].append(item)
    
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        #if response.status_code == 200:
        print("Create Order HTTP Status:", response.status_code)
        printPPResponse(data)
        return data
    except Exception as e:
        raise Exception(f"Failed to create order: {e}")


# Only run test function in the main process
if os.environ.get("WERKZEUG_RUN_MAIN") == "true":

    decode_base64('eyJpbnRlbnQiOiJhdXRob3JpemUiLCJwYXllciI6eyJwYXltZW50X21ldGhvZCI6InBheXBhbCIsImZ1bmRpbmdfaW5zdHJ1bWVudHMiOlt7ImJpbGxpbmciOnsiYmlsbGluZ19hZ3JlZW1lbnRfaWQiOiJCLTVORTM5NDE1V0I0OTE0NDE3In19XX0sInRyYW5zYWN0aW9ucyI6W3siYW1vdW50Ijp7InRvdGFsIjoiMjcyLjQyIiwiY3VycmVuY3kiOiJVU0QiLCJkZXRhaWxzIjp7InN1YnRvdGFsIjoiMjMzLjAwIiwic2hpcHBpbmciOiIyNC4wMCIsImluc3VyYW5jZSI6IjE1LjQyIn19LCJpbnZvaWNlX251bWJlciI6IkZGUFBTQlgyNlM2WEFDRUZEMzNZIiwicGF5bWVudF9vcHRpb25zIjp7ImFsbG93ZWRfcGF5bWVudF9tZXRob2QiOiJVTlJFU1RSSUNURUQiLCJyZWN1cnJpbmdfZmxhZyI6ZmFsc2UsInNraXBfZm1mIjpmYWxzZX0sIml0ZW1fbGlzdCI6eyJpdGVtcyI6W3sibmFtZSI6IioqKioqKioqKioiLCJza3UiOiIwIiwicHJpY2UiOiIyMzMuMDAiLCJjdXJyZW5jeSI6IlVTRCIsInF1YW50aXR5IjoxfV0sInNoaXBwaW5nX2FkZHJlc3MiOnsicmVjaXBpZW50X25hbWUiOiIqKioqKioqKioqIiwibGluZTEiOiIqKioqKioqKioqIiwiY2l0eSI6IioqKioqKioqKioiLCJzdGF0ZSI6IkRDIiwicG9zdGFsX2NvZGUiOiIqKioqKioqKioqIiwiY291bnRyeV9jb2RlIjoiVVMiLCJkZWZhdWx0X2FkZHJlc3MiOmZhbHNlLCJwcmVmZXJyZWRfYWRkcmVzcyI6ZmFsc2UsInByaW1hcnlfYWRkcmVzcyI6ZmFsc2UsImRpc2FibGVfZm9yX3RyYW5zYWN0aW9uIjpmYWxzZX19LCJyZWxhdGVkX3Jlc291cmNlcyI6W119XX0=')

    #decode_base64('eyJhZGRyZXNzIjp7ImFkZHJlc3NfbGluZV8xIjoidmlhIGRlbCB2aWxsb25lIDU1IiwiYWRtaW5fYXJlYV8yIjoiUGlzdG9pYSIsImFkbWluX2FyZWFfMSI6IlBUIiwicG9zdGFsX2NvZGUiOiI1MTEwMCIsImNvdW50cnlfY29kZSI6IklUIn19')
    
    # result = gateway.transaction.sale({
    #     "amount": "10.00",
    #     "credit_card": {
    #         "expiration_date": "01/2029",
    #         "number":"4023898493988028",
    #     },
    # })

#createTransaction(None, "10.00", "88776911803", False, "ab3g3whq", None)
    

#     # # Create and start the thread
#     # thread = Thread(target=manageDisputeTest, args=(result.transaction.id,))
#     # thread.start()

#     #my leachong@paypal.com
#     #username='AUU0Jtg24SEu5dLLc9666tXHDn9jNa6jK3NzvciB6L2bdJdzsrtK0pVf8dBGXew356RgsuF96N9JwQGg' #client id
#     #password='EHVzVi_HdHuqMjQVYQQx7NF8klp7E4qrZA8GVvZSTvSZ5Vxc4lQ3Cu67Rr9OtPqvxyDC-7E5RcBXCsAj' #client secret

#     #hk rcvt rcvr-hk-1@gmail.com
#     username='AQCfBdKURR7-n-y9466s_Q66bksi4hqsVDueUhmf2dpzC7CuLv-KQdmy9ABRoRXLNIIR5mw3zXrmgtfa' #client id
#     password='EGeA0eW3FHr5soQ7Z37J0YRyOfJMvDvzQkuAp0Q575-k7iIPSkzZ-2Z0hZ1828ApCN-VQ2nsEaDfnxgZ' #client secret

#     #my rcvt leachong-my@paypal.com
#     #username='Ab7PV4MNIymVgzPbDHNdAKtbYSRJvI9alA9lGso_dDrpgGaiVNyCbW4xO7Xb2ithkDwI1QE7ArJOKmOk' #client id
#     #password='ENh9kVABew5fn9QFCILYOR3491n_mztetpZ8DOrSdzDRMNPzBoUE1f6b3wr8tcSj0AR5EJFkG8BFdD8D' #client secret


#     clientToken = post_pp_client_token(username, password)
#     receiver_email_list = [
#          'buyer-id-1@gmail.com'
#         # 'buyer-my-2@gmail.com'
#         # 'buyer-tw-1@gmail.com'
#         # 'buyer-sg-1@gmail.com'
#         # 'buyer-th-1@gmail.com'
#     ]

#     send_pp_payout(clientToken, currency="IDR", amount="1000", payout_receiver_email_list=receiver_email_list)

    # randomUUID = str(uuid.uuid1())
    # put_stc(clientToken, randomUUID)




# Run the backend app
if __name__ == "__main__":

    port = int(os.getenv('PORT', '5000'))
    #app.run(host='0.0.0.0', port=port)
    app.run(host='0.0.0.0', port=port, debug=True)
    # Get the PORT environment variable, or use 5000 if not set
    # portNumber = int(os.environ.get("PORT", 5000))
    # # Bind to 0.0.0.0 to allow Render to connect
    # app.run(host="0.0.0.0", port=portNumber, debug=True)

    #app.run(debug=True)
#    app.run(host="0.0.0.0", port=8000, debug=True)
#    app.run(debug=True, host="0.0.0.0", port=50000)
