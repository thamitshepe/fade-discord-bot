const fees = {
  paypal: 0,
  crypto: 0,
  paysafecard: 15,
  giftcard: 15,
};

const instructions = {
  paypal: 'A staff member will send you payment instructions shortly.',
  crypto: 'A staff member will send you payment instructions shortly.',
  paysafecard: 'A staff member will send you payment instructions shortly.',
  giftcard: 'A staff member will send you payment instructions shortly.',
};

function getPaymentInfo(method) {
  return {
    instructions: instructions[method] || 'Staff will provide payment details shortly.',
    fee: fees[method] || 0,
  };
}

module.exports = { getPaymentInfo };
