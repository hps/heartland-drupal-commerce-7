//call method untill Heartland loaded
var interval = setInterval(loadIframeTokenization, 100);
var attempts = 0;
var public_key = Drupal.settings.securesubmit.publicKey;

//method to load iframe
function loadIframeTokenization() {
    'use strict';
    //check whether Heartland is loaded
    if (typeof Heartland == 'object') {
        clearInterval(interval);
    } else {
        attempts++;
        if (attempts > 20) {
            alert('Problem loading payment Method! Try again later.');
            clearInterval(interval);
        }
        return;
    }
    alert(public_key);
    // Create a new `HPS` object with the necessary configuration
    var hps = new Heartland.HPS({
        publicKey: public_key,
        type: 'iframe',
        // Configure the iframe fields to tell the library where
        // the iframe should be inserted into the DOM and some
        // basic options
        fields: {
            cardNumber: {
                target: 'iframesCardCvv',
                placeholder: '•••• •••• •••• ••••'
            },
            cardExpiration: {
                target: 'iframesCardExpiration',
                placeholder: 'MM / YYYY'
            },
            cardCvv: {
                target: 'iframesCardCvv',
                placeholder: 'CVV'
            }
        },
        // Collection of CSS to inject into the iframes.
        // These properties can match the site's styles
        // to create a seamless experience.
        style: {
            'input[type=text],input[type=tel]': {
                'box-sizing': 'border-box',
                'display': 'block',
                'width': '100%',
                'height': '34px',
                'padding': '6px 12px',
                'font-size': '14px',
                'line-height': '1.42857143',
                'color': '#555',
                'background-color': '#fff',
                'background-image': 'none',
                'border': '1px solid #ccc',
                'border-radius': '4px',
                '-webkit-box-shadow': 'inset 0 1px 1px rgba(0,0,0,.075)',
                'box-shadow': 'inset 0 1px 1px rgba(0,0,0,.075)',
                '-webkit-transition': 'border-color ease-in-out .15s,-webkit-box-shadow ease-in-out .15s',
                '-o-transition': 'border-color ease-in-out .15s,box-shadow ease-in-out .15s',
                'transition': 'border-color ease-in-out .15s,box-shadow ease-in-out .15s'
            },
            'input[type=text]:focus,input[type=tel]:focus': {
                'border-color': '#66afe9',
                'outline': '0',
                '-webkit-box-shadow': 'inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6)',
                'box-shadow': 'inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6)'
            },
            'input[type=submit]': {
                'box-sizing': 'border-box',
                'display': 'inline-block',
                'padding': '6px 12px',
                'margin-bottom': '0',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '1.42857143',
                'text-align': 'center',
                'white-space': 'nowrap',
                'vertical-align': 'middle',
                '-ms-touch-action': 'manipulation',
                'touch-action': 'manipulation',
                'cursor': 'pointer',
                '-webkit-user-select': 'none',
                '-moz-user-select': 'none',
                '-ms-user-select': 'none',
                'user-select': 'none',
                'background-image': 'none',
                'border': '1px solid transparent',
                'border-radius': '4px',
                'color': '#fff',
                'background-color': '#337ab7',
                'border-color': '#2e6da4'
            },
            'input[type=submit]:hover': {
                'color': '#fff',
                'background-color': '#286090',
                'border-color': '#204d74'
            },
            'input[type=submit]:focus, input[type=submit].focus': {
                'color': '#fff',
                'background-color': '#286090',
                'border-color': '#122b40',
                'text-decoration': 'none',
                'outline': '5px auto -webkit-focus-ring-color',
                'outline-offset': '-2px'
            }
        },
        // Callback when a token is received from the service
        onTokenSuccess: function (resp) {
            secureSubmitResponseHandler(resp);
        },
        // Callback when an error is received from the service
        onTokenError: function (resp) {
            secureSubmitResponseHandler(resp);
        }
    });

    function secureSubmitResponseHandler(response) {
        if (response.error !== undefined && response.error.message !== undefined) {
            alert(response.error.message);
        } else {
            var theForm = $('#commerce-checkout-form-review');
            // create field and append to form
            $("<input>").attr({
                type: "hidden",
                id: "token_value",
                name: "token_value",
                value: response.token_value
            }).appendTo(theForm);

            var re = {
                visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
                mastercard: /^5[1-5][0-9]{14}$/,
                amex: /^3[47][0-9]{13}$/,
                diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
                discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
                jcb: /^(?:2131|1800|35\d{3})\d{11}$/
            };

            if (re.visa.test($.trim($("#card_number").val()))) {
                cardType = 'visa';
            } else if (re.mastercard.test($.trim($("#card_number").val()))) {
                cardType = 'mastercard';
            } else if (re.amex.test($.trim($("#card_number").val()))) {
                cardType = 'amex';
            } else if (re.diners.test($.trim($("#card_number").val()))) {
                cardType = 'diners';
            } else if (re.discover.test($.trim($("#card_number").val()))) {
                cardType = 'discover';
            } else if (re.jcb.test($.trim($("#card_number").val()))) {
                cardType = 'jcb';
            }

            $("<input>").attr({
                type: "hidden",
                id: "card_type",
                name: "card_type",
                value: cardType
            }).appendTo(theForm);

            $("<input>").attr({
                type: "hidden",
                id: "exp_month",
                name: "exp_month",
                value: $.trim($("#exp_month").val())
            }).appendTo(theForm);

            $("<input>").attr({
                type: "hidden",
                id: "exp_year",
                name: "exp_year",
                value: $.trim($("#exp_year").val())
            }).appendTo(theForm);

            $("<input>").attr({
                type: "hidden",
                id: "last_four",
                name: "last_four",
                value: $("#card_number").val().slice(-4)
            }).appendTo(theForm);

            // success handler provided
            if (typeof data.success === 'function') {
                // call the handler with payload
                if (data.success(response) === false) {
                    return; // stop processing
                }
            }

            theForm.unbind('submit'); // unbind event handler
            theForm.submit(); // submit the form
        }
        return false;
    }
}