/**
 * @file
 * SecureSubmit tokenization logic.
 */

(function ($) {
  Drupal.behaviors.securesubmit = {
    attach: function (context, settings) {
      if (settings.securesubmit.fetched == null) {
        settings.securesubmit.fetched = true;
        // Configure Globalpayment JS
        GlobalPayments.configure({
          publicApiKey: settings.securesubmit.publicKey
        });

        const hps = GlobalPayments.ui.form({
          fields: {
            "card-holder-name": {
              placeholder: "Jane Smith",
              target: "#owner"
            },
            "card-number": {
              placeholder: "•••• •••• •••• ••••",
              target: "#number"
            },
            "card-expiration": {
              placeholder: "MM / YYYY",
              target: "#exp_month"
            },
            "card-cvv": {
              placeholder: "•••",
              target: "#code"
            },
            styles: {
              'html' : {
                "-webkit-text-size-adjust": "100%"
              },
              'body' : {
                'width' : '100%'
              },
              '#secure-payment-field-wrapper' : {
                'position' : 'relative',
                'width' : '100%'
              },
              '#secure-payment-field' : {
                'box-sizing':'border-box',
                'text-transform': 'uppercase',
                'display': 'block',
                'width': '100%',
                'height': '48px',
                'padding': '6px 12px',
                'font-size': '14px',
                'line-height': '1.42857143',
                'color': '#555',
                'background-color': '#fff',
                'border': '1px solid #b5b5b5',
                '-webkit-box-shadow': 'inset 0 1px 1px rgba(0,0,0,.075)',
                'box-shadow': 'inset 0 1px 1px rgba(0,0,0,.075)',
                '-webkit-transition': 'border-color ease-in-out .15s,-webkit-box-shadow ease-in-out .15s',
                '-o-transition': 'border-color ease-in-out .15s,box-shadow ease-in-out .15s',
                'transition': 'border-color ease-in-out .15s,box-shadow ease-in-out .15s'
              },
              '#secure-payment-field:focus' : {
                'border-color': '#3989e3',
                'outline': '0',
                '-webkit-box-shadow': 'none',
                'box-shadow': 'none'
              },
              '.card-number::-ms-clear' : {
                'display' : 'none'
              },
              'input[placeholder]' : {
                'font-family':'sans-serif !important',
                'letter-spacing': '3px'
              },
            }
          }
        });

        hps.ready(() => {
          console.log("Registration of all credit card fields occurred");
          // to update the credit card fields labels
          $('#cc_exp_year').hide();

          $('#cc_owner').text("CARD HOLDER NAME");
          $('#cc_number').text("CARD NUMBER");
          $('#cc_exp_month').text("CARD EXPIRATION");
          $('#cc_code').text("CARD CVV");
          });

        hps.on("token-success", (resp) => {
          secureSubmitResponseHandler(resp);
        });

        hps.on("token-error", (resp) => {
          secureSubmitResponseHandler(resp);
          return true;
        });

        function secureSubmitResponseHandler(resp) {

          var $form = this.form;
          var i, input;

          if(resp.error) {
            if(resp.message) {
              var error_message = resp?.error?.message ?? resp?.resp[0]?.message;
            }
            if(resp.reasons) {
              var error_message = resp?.error?.reasons ?? resp?.reasons[0]?.message;
            }
          }

          if (error_message) {
            // Show the errors on the form.
            $('div.payment-errors').html($("<div class='messages messages--error error'></div>").html(error_message));

            if (window.onError) {
              window.onError(form$);
            }

            $('.form-submit').removeAttr("disabled");
            $('.form-submit').prop('disabled', null);
            $("#edit-back").hide();
          } else {
            var token = resp.paymentReference ? resp.paymentReference : resp.token_value;
            $("#edit-continue").closest("form").append("<input type='hidden' name='securesubmitToken' value='" + token + "'/>");


            /*
            * Create hidden form inputs to capture
            * the values passed back from tokenization.
            */
            if (resp.details) {
              var last4 = document.createElement('input');
              last4.type = 'hidden';
              last4.id = 'last_four';
              last4.name = 'last_four';
              last4.value = resp.details.cardLast4;
              $("#edit-continue").closest("form").append(last4);

              var cType = document.createElement('input');
              cType.type = 'hidden';
              cType.id = 'card_type';
              cType.name = 'card_type';
              cType.value = resp.details.cardType;
              $("#edit-continue").closest("form").append(cType);

              var expMo = document.createElement('input');
              expMo.type = 'hidden';
              expMo.id = 'exp_month';
              expMo.name = 'exp_month';
              expMo.value = resp.details.expiryMonth;
              $("#edit-continue").closest("form").append(expMo);

              var expYr = document.createElement('input');
              expYr.type = 'hidden';
              expYr.id = 'exp_year';
              expYr.name = 'exp_year';
              expYr.value = resp.details.expiryYear;
              $("#edit-continue").closest("form").append(expYr);
            }

            // Add tokenization response to the form
            createSecureSubmitResponseNode(JSON.stringify(resp));
            $("#edit-continue").closest("form").get(0).submit($("#edit-continue").closest("form"));

            return false;
          }
        }

        function createSecureSubmitResponseNode(resp) {
          var secureSubmitResponse = document.createElement('input');
          secureSubmitResponse.type = 'hidden';
          secureSubmitResponse.id = 'securesubmit_response';
          secureSubmitResponse.name = 'securesubmit_response';
          secureSubmitResponse.value = resp;
          $("#edit-continue").closest("form").append(secureSubmitResponse);
        }

        var triggerSubmit = function () {
          // manually include iframe submit button
          const fields = ['submit'];
          const target = hps.frames['card-number'];

          for (const type in hps.frames) {
            if (hps.frames.hasOwnProperty(type)) {
              fields.push(type);
            }
          }

          for (const type in hps.frames) {
            if (!hps.frames.hasOwnProperty(type)) {
              continue;
            }

            const frame = hps.frames[type];

            if (!frame) {
              continue;
            }

            $('#commerce-checkout-form-review').attr('id',target.id);

            GlobalPayments.internal.postMessage.post({
              data: {
                fields: fields,
                target: target.id
              },
              id: frame.id,
              type: 'ui:iframe-field:request-data'
            }, frame.id);
          }
        }

        $('body').delegate('#edit-continue', 'click', function(event) {
          // ensure we are selected
          if ($("input[value*='commerce_securesubmit|']").is(':checked')) {
            $(this).addClass('auth-processing');

            // Show progress animated gif (needed for submitting after first error).
            $('.checkout-processing').show();

            // Disable the submit button to prevent repeated clicks.
            $('.form-submit').attr("disabled", "disabled");

            // Prevent the form from submitting with the default action.


            var cardFields = {
              exp_month: 'edit-commerce-payment-payment-details-credit-card-exp-month',
              exp_year: 'edit-commerce-payment-payment-details-credit-card-exp-year',
            };

            $('#edit-commerce-payment-payment-details-credit-card-expiry-date').val(
              $('[id^=' + cardFields.exp_month +']').val() +'/' +
              $('[id^=' + cardFields.exp_year +']').val()
            );

            event.preventDefault();
            triggerSubmit();
            return true;
          }
        });
      }
    }
  }
})(jQuery);
