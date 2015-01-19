/**
 * @file
 * SecureSubmit tokenization logic.
 */

(function ($) {
  Drupal.behaviors.securesubmit = {
    attach: function (context, settings) {
      if (settings.securesubmit.fetched == null) {
        settings.securesubmit.fetched = true;

        var createToken = function (cardFieldMap) {
          hps.tokenize({
            data: {
              public_key: settings.securesubmit.publicKey,
              number: $('[id^=' + cardFieldMap.number +']').val(),
              cvc: $('[id^=' + cardFieldMap.cvc +']').val(),
              exp_month: $('[id^=' + cardFieldMap.exp_month +']').val(),
              exp_year: $('[id^=' + cardFieldMap.exp_year +']').val()
            },
            success: function(response) {
              secureSubmitResponseHandler(response);
            },
            error: function(response) {
              secureSubmitResponseHandler(response);
            }
          });
        };

        function secureSubmitResponseHandler(response) {
          if (response.message) {
            // Show the errors on the form.
            $('div.payment-errors').html($("<div class='messages error'></div>").html(response.message));

            onError && onError(form$);
          } else {
            var token = response.token_value;
            $("#edit-continue").closest("form").append("<input type='hidden' name='securesubmitToken' value='" + token + "'/>");
            $("#edit-continue").closest("form").get(0).submit($("#edit-continue").closest("form"));
          }
        }

        $('body').delegate('#edit-continue', 'click', function(event) {
          // ensure we are selected
          if ($("input[value*='commerce_securesubmit|']").is(':checked')) {
            $(this).addClass('auth-processing');

            // Prevent the form from submitting with the default action.
            event.preventDefault();

            // Show progress animated gif (needed for submitting after first error).
            $('.checkout-processing').show();

            // Disable the submit button to prevent repeated clicks.
            $('.form-submit').attr("disabled", "disabled");
   
            var cardFields = {
              number: 'edit-commerce-payment-payment-details-credit-card-number',
              cvc: 'edit-commerce-payment-payment-details-credit-card-code',
              exp_month: 'edit-commerce-payment-payment-details-credit-card-exp-month',
              exp_year: 'edit-commerce-payment-payment-details-credit-card-exp-year',
              name: 'edit-commerce-payment-payment-details-credit-card-owner'
            };

            createToken(cardFields);

            return false;
          }
        });
      }
    }
  }
})(jQuery);
