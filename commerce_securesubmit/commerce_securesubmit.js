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
            "card-number": {
              placeholder: "•••• •••• •••• ••••",
              target: "#edit-commerce-payment-payment-details-credit-card-number"
            },
            "card-expiration": {
              placeholder: "MM / YYYY",
              target: "#edit-commerce-payment-payment-details-credit-card-expiry-date"
            },
            "card-cvv": {
              placeholder: "•••",
              target: "#edit-commerce-payment-payment-details-credit-card-code"
            }
          }
        });

        hps.ready(() => {
          console.log("Registration of all credit card fields occurred");
        });

        hps.on("token-success", (resp) => {
          secureSubmitResponseHandler(resp);
        });

        hps.on("token-error", (resp) => {
          secureSubmitResponseHandler(resp);
          return true;
        });

        // hps.on("token-success", function(response) {
        //   secureSubmitResponseHandler(response);
        // });
        //
        // hps.on("token-error", function(response) {
        //   secureSubmitResponseHandler(response);
        // });

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

        function secureSubmitResponseHandler(response) {
          var error_message = response?.error?.message ?? response?.reasons[0]?.message;

          if (error_message) {
            // Show the errors on the form.
            $('div.payment-errors').html($("<div class='messages messages--error error'></div>").html(error_message));

            if (window.onError) {
              window.onError(form$);
            }

            $('.form-submit').removeAttr("disabled");
            $('.form-submit').prop('disabled', null);
          } else {
            var token = response.paymentReference ? response.paymentReference : response.token_value;
            $("#edit-continue").closest("form").append("<input type='hidden' name='securesubmitToken' value='" + token + "'/>");
            $("#edit-continue").closest("form").get(0).submit($("#edit-continue").closest("form"));
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
            event.preventDefault();

            var cardFields = {
              exp_month: 'edit-commerce-payment-payment-details-credit-card-exp-month',
              exp_year: 'edit-commerce-payment-payment-details-credit-card-exp-year',
            };

            $('#edit-commerce-payment-payment-details-credit-card-expiry-date').val(
              $('[id^=' + cardFields.exp_month +']').val() +'/' +
              $('[id^=' + cardFields.exp_year +']').val()
            );
            triggerSubmit();
            return false;
          }
        });
      }
    }
  }
})(jQuery);
